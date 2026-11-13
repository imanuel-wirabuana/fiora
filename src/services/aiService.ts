import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { streamText } from "ai"
import { z } from "zod"
import { clampMoodScore, MAX_MOODS, MIN_MOODS } from "@/lib/relationship"
import type { MoodOption } from "@/types/relationship"

export interface MoodDraftInput {
  emoji: string
  label: string
  score?: number
}

const aiScoreArraySchema = z.array(
  z.object({
    index: z.coerce.number().int().nonnegative(),
    score: z.coerce.number(),
  })
)

const aiManagedMoodArraySchema = z.array(
  z.object({
    emoji: z.string().trim().min(1),
    label: z.string().trim().min(1),
    score: z.coerce.number(),
  })
)

function getAIClient() {
  const baseURL = import.meta.env.VITE_AI_BASE_URL
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const model = import.meta.env.VITE_AI_MODEL || "fiora-ai"

  if (!baseURL || !apiKey) {
    throw new Error(
      "Missing VITE_AI_BASE_URL or VITE_AI_API_KEY environment variables."
    )
  }

  const provider = createOpenAICompatible({
    name: "fiora-ai",
    baseURL,
    apiKey,
  })

  return provider(model)
}

function extractJsonArray<T>(text: string, schema: z.ZodType<T[]>): T[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  const arrayStart = cleaned.indexOf("[")
  const arrayEnd = cleaned.lastIndexOf("]")

  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const parsed = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1))
    return schema.parse(parsed)
  }

  const objStart = cleaned.indexOf("{")
  const objEnd = cleaned.lastIndexOf("}")
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const parsedObj = JSON.parse(cleaned.slice(objStart, objEnd + 1)) as Record<
      string,
      unknown
    >
    const candidateArray = Object.values(parsedObj).find((val) =>
      Array.isArray(val)
    )
    if (candidateArray) {
      return schema.parse(candidateArray)
    }
  }

  throw new Error("AI response did not contain a valid JSON array.")
}

async function streamCompletion({
  system,
  prompt,
  temperature,
}: {
  system: string
  prompt: string
  temperature: number
}): Promise<string> {
  const model = getAIClient()
  const result = streamText({
    model,
    temperature,
    system,
    prompt,
  })

  let accumulated = ""
  for await (const delta of result.textStream) {
    accumulated += delta
  }
  return accumulated
}

export const aiService = {
  /**
   * Score a list of mood options from 0.1 (very bad) to 1.0 (very good)
   * using Vercel AI SDK streamText and the configured fiora-ai provider.
   */
  async scoreMoods(moods: MoodDraftInput[]): Promise<MoodOption[]> {
    if (moods.length === 0) return []

    const payload = moods.map((mood, index) => ({
      index,
      emoji: mood.emoji.trim(),
      label: mood.label.trim(),
    }))

    const text = await streamCompletion({
      temperature: 0.1,
      system:
        "You are an emotion sentiment scorer for a couples mood tracker app. " +
        "Score each mood based on BOTH its emoji icon and text label on a scale from 0.1 to 1.0 (with 1 decimal place):\n" +
        "- 0.1 means very bad, miserable, or heartbroken (e.g. 😭 Devastated, 💔 Heartbroken, 😡 Furious, 😔 Down = 0.2)\n" +
        "- 0.5 means neutral toward bad, needy, tired, or overwhelmed (e.g. 🥺 Needy, 😴 Tired = 0.4, 😐 Neutral = 0.5)\n" +
        "- 1.0 means very good, loving, joyful, or ecstatic (e.g. 🥰 Loved = 1.0, 😊 Happy = 0.8, 🤩 Excited = 0.9)\n" +
        "Ensure the emoji icon and label context together determine the score, and give EVERY mood a unique score (no duplicate scores). " +
        'Respond ONLY with a valid JSON array of objects with `index` and `score` (e.g. [{"index":0,"score":1.0}]), no extra text.',
      prompt: `Score these moods based on their icon and label:\n${JSON.stringify(payload)}`,
    })

    const parsed = extractJsonArray(text, aiScoreArraySchema)
    const scoreByIndex = new Map<number, number>(
      parsed.map((item) => [item.index, clampMoodScore(item.score)])
    )

    return moods.map((mood, index) => ({
      emoji: mood.emoji.trim(),
      label: mood.label.trim(),
      score:
        scoreByIndex.get(index) ??
        (typeof mood.score === "number" ? clampMoodScore(mood.score) : 0.5),
    }))
  },

  /**
   * Manage (add, edit, remove, or replace) moods based on a user prompt,
   * returning between MIN_MOODS and MAX_MOODS scored mood options.
   */
  async manageMoodsWithPrompt(
    moods: MoodDraftInput[],
    instruction: string
  ): Promise<MoodOption[]> {
    const text = await streamCompletion({
      temperature: 0.3,
      system:
        "You are a couples mood assistant for the Fiora app. " +
        "Update the user's mood list according to their instruction (adding, editing, removing, or replacing moods as requested). " +
        `Rules:\n` +
        `- Total moods MUST be between ${MIN_MOODS} and ${MAX_MOODS}.\n` +
        "- Each mood must have `emoji` (1 emoji), `label` (short name, max 20 chars), and `score` (0.1 = very bad, 0.5 = neutral, 1.0 = very good, unique per mood).\n" +
        'Respond ONLY with a valid JSON array of objects: [{"emoji":"🥰","label":"Loved","score":1.0}], no extra text.',
      prompt: `Current moods:\n${JSON.stringify(moods)}\n\nUser instruction:\n${instruction}`,
    })

    const parsed = extractJsonArray(text, aiManagedMoodArraySchema)
    return parsed.slice(0, MAX_MOODS).map((item) => ({
      emoji: item.emoji.slice(0, 4),
      label: item.label.slice(0, 20),
      score: clampMoodScore(item.score),
    }))
  },
}

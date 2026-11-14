import type { Gender, MoodOption, NudgeOption } from "../types/relationship"

export const MIN_MOODS = 5
export const MAX_MOODS = 33

export const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { emoji: "🥰", label: "Loved", score: 1.0 },
  { emoji: "🤩", label: "Excited", score: 0.9 },
  { emoji: "😊", label: "Happy", score: 0.8 },
  { emoji: "😌", label: "Calm", score: 0.7 },
  { emoji: "🥺", label: "Needy", score: 0.6 },
  { emoji: "🤔", label: "Thoughtful", score: 0.5 },
  { emoji: "😴", label: "Tired", score: 0.4 },
  { emoji: "😰", label: "Anxious", score: 0.3 },
  { emoji: "😔", label: "Down", score: 0.2 },
  { emoji: "😭", label: "Overwhelmed", score: 0.1 },
]

const DEFAULT_SCORE_BY_LABEL = new Map(
  DEFAULT_MOOD_OPTIONS.map((mood) => [mood.label.toLowerCase(), mood.score])
)

/**
 * Clamp a mood sentiment score to a number in [0.01, 1.0] rounded to 2 decimal places.
 * Also handles legacy 1-10 scores by dividing by 10.
 */
export function clampMoodScore(score: number): number {
  if (!Number.isFinite(score)) return 0.5
  const normalized = score > 1 ? score / 10 : score
  const clamped = Math.min(1.0, Math.max(0.01, normalized))
  return Math.round(clamped * 100) / 100
}

/**
 * Sort moods from good (highest score) to bad (lowest score).
 */
export function sortMoodsByScore(moods: MoodOption[]): MoodOption[] {
  return [...moods].sort((a, b) => b.score - a.score)
}

/**
 * Assign evenly spaced unique good-to-bad scores in the given array order: (N - i) / N.
 * E.g. 5 moods -> [1.0, 0.8, 0.6, 0.4, 0.2]; 10 moods -> [1.0, 0.9, ..., 0.1].
 */
export function assignMoodScoresByOrder(
  moods: Array<Omit<MoodOption, "score"> & { score?: number }>
): MoodOption[] {
  const total = moods.length
  if (total === 0) return []

  return moods.map((mood, index) => ({
    ...mood,
    score: Math.round(((total - index) / total) * 100) / 100,
  }))
}

/**
 * Sort moods good-to-bad and assign evenly spaced unique scores: (N - i) / N.
 */
export function distributeMoodScores(moods: MoodOption[]): MoodOption[] {
  return assignMoodScoresByOrder(sortMoodsByScore(moods))
}

export type MoodCategory =
  | "very-good"
  | "good"
  | "neutral"
  | "bad"
  | "very-bad"

/**
 * Determine 5-tier balanced mood category for a 0-based index in a good-to-bad sorted list.
 * Guarantees veryGood === veryBad, good === bad, and veryGood < good for N >= 7.
 */
export function getMoodCategory(index: number, total: number): MoodCategory {
  if (total < 5) return "neutral"
  const sideTotal = Math.floor((total - 1) / 2)
  const extremeCount = Math.max(1, Math.floor(sideTotal / 3))
  if (index < extremeCount) return "very-good"
  if (index < sideTotal) return "good"
  if (index >= total - extremeCount) return "very-bad"
  if (index >= total - sideTotal) return "bad"
  return "neutral"
}

/**
 * Ensure legacy or partial mood entries have valid unique scores and respect 5-33 limits.
 */
export function normalizeMoodOptions(
  moods: Array<Partial<MoodOption>> | null | undefined
): MoodOption[] {
  if (!moods || moods.length === 0) {
    return DEFAULT_MOOD_OPTIONS
  }

  const normalized = moods
    .filter((m): m is Partial<MoodOption> & { emoji: string; label: string } =>
      Boolean(m.emoji?.trim() && m.label?.trim())
    )
    .slice(0, MAX_MOODS)
    .map((mood) => {
      const fallbackScore =
        DEFAULT_SCORE_BY_LABEL.get(mood.label.trim().toLowerCase()) ?? 0.5
      return {
        emoji: mood.emoji.trim(),
        label: mood.label.trim(),
        score:
          typeof mood.score === "number"
            ? clampMoodScore(mood.score)
            : fallbackScore,
      }
    })

  return distributeMoodScores(normalized)
}

export const MIN_NUDGES = 3
export const MAX_NUDGES = 11
export const MAX_PINNED_NUDGES = 3

export const DEFAULT_NUDGE_OPTIONS: NudgeOption[] = [
  { emoji: "💌", label: "Thinking of you" },
  { emoji: "🤗", label: "Need a hug" },
  { emoji: "☕", label: "Coffee break?" },
  { emoji: "😘", label: "Sending a kiss" },
]

export const DEFAULT_DAILY_QUIZ_COUNT = 3
export const DAILY_QUIZ_COUNT_OPTIONS = [1, 2, 3, 5] as const

export const DEFAULT_AVATARS_BY_GENDER: Record<Gender, string[]> = {
  male: ["💙", "🤠", "🦊", "🐻", "🤖"],
  female: ["🩷", "🌸", "🐱", "🦋", "🦄"],
}

export function getDefaultAvatar(gender: Gender | null): string {
  if (gender === "female") return "🩷"
  return "💙"
}

export function generateInviteCode(): string {
  // Generate a random 5-digit string (e.g. 10000 - 99999)
  const code = Math.floor(10000 + Math.random() * 90000)
  return String(code)
}

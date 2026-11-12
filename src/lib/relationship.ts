import type { Gender, MoodOption, NudgeOption } from "../types/relationship"

export const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { emoji: "🥰", label: "Loved" },
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥺", label: "Needy" },
  { emoji: "😔", label: "Down" },
]

export const DEFAULT_NUDGE_OPTIONS: NudgeOption[] = [
  { emoji: "💌", label: "Thinking of you" },
  { emoji: "🤗", label: "Need a hug" },
  { emoji: "☕", label: "Coffee break?" },
  { emoji: "📞", label: "Call me soon" },
]

export const DEFAULT_DAILY_QUIZ_COUNT = 3
export const DAILY_QUIZ_COUNT_OPTIONS = [1, 2, 3, 5] as const

export const DEFAULT_AVATARS_BY_GENDER: Record<Gender, string[]> = {
  male: ["🙋‍♂️", "👦", "👨", "🧔", "🦊", "🐶"],
  female: ["🙋‍♀️", "👧", "👩", "👩‍🦰", "🐱", "🐰"],
}

export function getDefaultAvatar(gender: Gender | null): string {
  if (gender === "female") return "🙋‍♀️"
  return "🙋‍♂️"
}

export function generateInviteCode(): string {
  // Generate a random 5-digit string (e.g. 10000 - 99999)
  const code = Math.floor(10000 + Math.random() * 90000)
  return String(code)
}

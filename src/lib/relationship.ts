import type { MoodOption } from "../types/relationship"

export const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { emoji: "🥰", label: "Loved" },
  { emoji: "😊", label: "Happy" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🥺", label: "Needy" },
  { emoji: "😔", label: "Down" },
]

export function generateInviteCode(): string {
  // Generate a random 5-digit string (e.g. 10000 - 99999)
  const code = Math.floor(10000 + Math.random() * 90000)
  return String(code)
}


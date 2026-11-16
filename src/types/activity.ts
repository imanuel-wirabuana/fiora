export type ActivityType = "mood" | "nudge" | "journal" | "chat"

export interface MoodActivityContent {
  emoji: string
  label: string
  score?: number
  note?: string
}

export interface NudgeActivityContent {
  emoji: string
  label: string
}

export interface JournalActivityContent {
  title: string
  body: string
  isShared?: boolean
}

export interface ChatActivityContent {
  text: string
}

export type ActivityContent =
  | MoodActivityContent
  | NudgeActivityContent
  | JournalActivityContent
  | ChatActivityContent

export interface Activity<T = ActivityContent> {
  id: number
  relationship_id: number
  user_id: string
  type: ActivityType
  content: T | null
  created_at: string
  updated_at: string | null
}

export interface CreateActivityInput {
  relationshipId: number
  type: ActivityType
  content: ActivityContent
}


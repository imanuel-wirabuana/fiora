export type ActivityType = "mood" | "nudge" | "journal"

export interface MoodActivityContent {
  emoji: string
  label: string
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

export type ActivityContent =
  | MoodActivityContent
  | NudgeActivityContent
  | JournalActivityContent

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


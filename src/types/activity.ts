export type ActivityType = "mood" | "nudge" | "journal" | "chat" | "pet"

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

export interface ChatReplyRef {
  id: number
  userId: string
  senderName: string
  text: string
}

export interface ChatActivityContent {
  text: string
  replyTo?: ChatReplyRef
  reactions?: Record<string, string>
  editedAt?: string
  deletedFor?: string[]
}

export interface PetActivityContent {
  petId: number
  petName: string
  action: "eat" | "play" | "bath" | "sleep" | "adopt" | "rename"
  emoji: string
  level?: number
}

export type ActivityContent =
  | MoodActivityContent
  | NudgeActivityContent
  | JournalActivityContent
  | ChatActivityContent
  | PetActivityContent

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


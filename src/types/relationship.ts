import type { PushSubscriptionData } from "./notification"

export type Gender = "male" | "female"

export interface MoodOption {
  emoji: string
  label: string
  score: number
}

export interface NudgeOption {
  emoji: string
  label: string
}

export interface MemberLocation {
  userId: string
  lat: number
  lng: number
  updated_at: string
  placeName?: string
}

export interface DailyQuizState {
  date: string
  quiz_ids: number[]
}

export interface RelationshipContent {
  anniversary?: string | null
  moods?: MoodOption[]
  nudges?: NudgeOption[]
  location_sharing?: boolean
  daily_quiz_count?: number
  daily_quiz?: DailyQuizState | null
  locations?: Record<string, MemberLocation>
  aliases?: Record<string, string>
}

export interface RelationshipMemberContent {
  gender?: Gender
  name?: string
  avatar?: string
  last_seen_at?: string
  last_activity?: string
  push_subscriptions?: PushSubscriptionData[]
}

export interface Relationship {
  id: number
  invite_code: string | null
  content: RelationshipContent | null
  created_at: string
  updated_at: string | null
}

export interface RelationshipMember {
  id: number
  relationship_id: number
  user_id: string
  content: RelationshipMemberContent | null
  created_at: string
  updated_at: string | null
}

export interface UserRelationshipData {
  relationship: Relationship
  currentMember: RelationshipMember
  partnerMember: RelationshipMember | null
  members: RelationshipMember[]
}

export interface CreateRelationshipInput {
  gender: Gender
  name: string
  avatar?: string
  anniversary?: string | null
  moods?: MoodOption[]
  nudges?: NudgeOption[]
  inviteCode?: string
}

export interface JoinRelationshipInput {
  gender: Gender
  name: string
  avatar?: string
  inviteCode: string
}

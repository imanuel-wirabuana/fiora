export type Gender = "male" | "female"

export interface MoodOption {
  emoji: string
  label: string
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
}

export interface RelationshipContent {
  anniversary?: string | null
  moods?: MoodOption[]
  nudges?: NudgeOption[]
  location_sharing?: boolean
}

export interface RelationshipMemberContent {
  gender?: Gender
  name?: string
  avatar?: string
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

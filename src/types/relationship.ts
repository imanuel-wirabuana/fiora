export type Gender = "male" | "female"

export interface MoodOption {
  emoji: string
  label: string
}

export interface RelationshipContent {
  moods?: MoodOption[]
}

export interface RelationshipMemberContent {
  gender?: Gender
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
  moods?: MoodOption[]
  inviteCode?: string
}

export interface JoinRelationshipInput {
  gender: Gender
  inviteCode: string
}


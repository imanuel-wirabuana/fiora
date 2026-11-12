export interface PresencePayload {
  userId: string
  activity: string
  onlineAt: string
  updatedAt: string
  isBackground: boolean
}

export interface PartnerPresenceState {
  isOnline: boolean
  activity: string | null
  onlineAt: string | null
  updatedAt: string | null
  isBackground: boolean
}


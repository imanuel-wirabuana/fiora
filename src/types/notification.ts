export type NotificationType = "nudge" | "mood" | "journal" | "quiz"

export interface NotificationContent {
  type: NotificationType
  title: string
  body: string
  url?: string
  emoji?: string
  senderId?: string
  senderName?: string
  isRead?: boolean
}

export interface NotificationRecord {
  id: number
  relationship_id: number
  user_id: string
  content: NotificationContent | null
  created_at: string
  updated_at: string | null
}

export interface CreateNotificationInput {
  relationshipId: number
  recipientUserId: string
  content: NotificationContent
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  createdAt: string
}

export type PushPermissionState = NotificationPermission | "unsupported"


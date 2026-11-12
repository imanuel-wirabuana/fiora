import { supabase } from "./supabase"
import type {
  CreateNotificationInput,
  NotificationContent,
  NotificationRecord,
} from "../types/notification"

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationRecord[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(error.message)
    }

    return (data as NotificationRecord[]) || []
  },

  async createNotification(
    input: CreateNotificationInput
  ): Promise<NotificationRecord> {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        relationship_id: input.relationshipId,
        user_id: input.recipientUserId,
        content: {
          isRead: false,
          ...input.content,
        },
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as NotificationRecord
  },

  async markAsRead(
    notificationId: number,
    currentContent: NotificationContent
  ): Promise<NotificationRecord> {
    const { data, error } = await supabase
      .from("notifications")
      .update({
        content: {
          ...currentContent,
          isRead: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as NotificationRecord
  },

  subscribeToNotifications(userId: string, onChange: () => void): () => void {
    const uniqueId = Math.random().toString(36).slice(2, 9)
    const channelName = `realtime-notifications-${userId}-${uniqueId}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}


import { useCallback, useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "../services/notificationService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type {
  NotificationContent,
  NotificationRecord,
  NotificationType,
} from "../types/notification"

export const notificationKeys = {
  all: ["notifications"] as const,
  byUser: (userId?: string) =>
    [...notificationKeys.all, "user", userId] as const,
}

export interface NotifyPartnerInput {
  type: NotificationType
  title: string
  body: string
  url?: string
  emoji?: string
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { relationship, currentMember, partnerMember } = useRelationship()

  const userId = user?.id
  const relationshipId = relationship?.id
  const partnerUserId = partnerMember?.user_id
  const senderName = currentMember?.content?.name || "Your partner"

  const query = useQuery<NotificationRecord[]>({
    queryKey: notificationKeys.byUser(userId),
    queryFn: () => {
      if (!userId) return Promise.resolve([])
      return notificationService.getNotifications(userId)
    },
    enabled: !!userId,
  })

  // Realtime listener for incoming notifications
  useEffect(() => {
    if (!userId) return

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      () => {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.byUser(userId),
        })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId, queryClient])

  const notifications = useMemo(() => query.data ?? [], [query.data])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.content?.isRead).length,
    [notifications]
  )

  const markAsReadMutation = useMutation<
    NotificationRecord,
    Error,
    { id: number; content: NotificationContent }
  >({
    mutationFn: ({ id, content }) =>
      notificationService.markAsRead(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.byUser(userId),
      })
    },
  })

  const notifyPartner = useCallback(
    async (input: NotifyPartnerInput) => {
      if (!relationshipId || !partnerUserId || !userId) return null

      try {
        return await notificationService.createNotification({
          relationshipId,
          recipientUserId: partnerUserId,
          content: {
            ...input,
            senderId: userId,
            senderName,
            isRead: false,
          },
        })
      } catch (err) {
        // Notification delivery should not break primary user actions (mood, nudge, etc.)
        console.warn("Failed to create partner notification:", err)
        return null
      }
    },
    [relationshipId, partnerUserId, userId, senderName]
  )

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
    notifyPartner,
    markAsRead: (notification: NotificationRecord) => {
      if (!notification.content || notification.content.isRead) return
      return markAsReadMutation.mutateAsync({
        id: notification.id,
        content: notification.content,
      })
    },
  }
}


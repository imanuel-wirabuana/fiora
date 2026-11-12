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

  const markAllAsReadMutation = useMutation<
    void,
    Error,
    NotificationRecord[],
    { previous?: NotificationRecord[] }
  >({
    mutationFn: (items) => notificationService.markAllAsRead(items),
    onMutate: async () => {
      if (!userId) return {}
      await queryClient.cancelQueries({
        queryKey: notificationKeys.byUser(userId),
      })
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        notificationKeys.byUser(userId)
      )
      if (previous) {
        queryClient.setQueryData<NotificationRecord[]>(
          notificationKeys.byUser(userId),
          previous.map((item) =>
            item.content
              ? { ...item, content: { ...item.content, isRead: true } }
              : item
          )
        )
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(
          notificationKeys.byUser(userId),
          context.previous
        )
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.byUser(userId),
        })
      }
    },
  })

  const deleteNotificationMutation = useMutation<
    void,
    Error,
    number,
    { previous?: NotificationRecord[] }
  >({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      if (!userId) return {}
      await queryClient.cancelQueries({
        queryKey: notificationKeys.byUser(userId),
      })
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        notificationKeys.byUser(userId)
      )
      if (previous) {
        queryClient.setQueryData<NotificationRecord[]>(
          notificationKeys.byUser(userId),
          previous.filter((item) => item.id !== id)
        )
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(
          notificationKeys.byUser(userId),
          context.previous
        )
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.byUser(userId),
        })
      }
    },
  })

  const clearAllMutation = useMutation<
    void,
    Error,
    void,
    { previous?: NotificationRecord[] }
  >({
    mutationFn: () => {
      if (!userId) return Promise.resolve()
      return notificationService.clearAllNotifications(userId)
    },
    onMutate: async () => {
      if (!userId) return {}
      await queryClient.cancelQueries({
        queryKey: notificationKeys.byUser(userId),
      })
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        notificationKeys.byUser(userId)
      )
      queryClient.setQueryData<NotificationRecord[]>(
        notificationKeys.byUser(userId),
        []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(
          notificationKeys.byUser(userId),
          context.previous
        )
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.byUser(userId),
        })
      }
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

  const { mutateAsync: markAllMutateAsync } = markAllAsReadMutation

  const markAllAsRead = useCallback(
    (items?: NotificationRecord[]) => {
      const target = items ?? notifications
      const hasUnread = target.some((n) => n.content && !n.content.isRead)
      if (!hasUnread) return Promise.resolve()
      return markAllMutateAsync(target)
    },
    [notifications, markAllMutateAsync]
  )

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isClearing: clearAllMutation.isPending,
    refetch: query.refetch,
    notifyPartner,
    markAsRead: (notification: NotificationRecord) => {
      if (!notification.content || notification.content.isRead) return
      return markAsReadMutation.mutateAsync({
        id: notification.id,
        content: notification.content,
      })
    },
    markAllAsRead,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    clearAllNotifications: clearAllMutation.mutateAsync,
  }
}

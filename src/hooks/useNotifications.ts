import { useCallback, useMemo } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import {
  NOTIFICATION_PAGE_SIZE,
  notificationService,
} from "../services/notificationService"
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

  const query = useInfiniteQuery<
    NotificationRecord[],
    Error,
    InfiniteData<NotificationRecord[], number>,
    ReturnType<typeof notificationKeys.byUser>,
    number
  >({
    queryKey: notificationKeys.byUser(userId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      if (!userId) return Promise.resolve([])
      return notificationService.getNotificationsPage(
        userId,
        pageParam,
        NOTIFICATION_PAGE_SIZE
      )
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < NOTIFICATION_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!userId,
  })

  const notifications = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data]
  )

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
    { previous?: InfiniteData<NotificationRecord[], number> }
  >({
    mutationFn: (items) => notificationService.markAllAsRead(items),
    onMutate: async () => {
      if (!userId) return {}
      await queryClient.cancelQueries({
        queryKey: notificationKeys.byUser(userId),
      })
      const previous = queryClient.getQueryData<
        InfiniteData<NotificationRecord[], number>
      >(notificationKeys.byUser(userId))
      if (previous) {
        queryClient.setQueryData<InfiniteData<NotificationRecord[], number>>(
          notificationKeys.byUser(userId),
          {
            ...previous,
            pages: previous.pages.map((page) =>
              page.map((item) =>
                item.content
                  ? { ...item, content: { ...item.content, isRead: true } }
                  : item
              )
            ),
          }
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
    { previous?: InfiniteData<NotificationRecord[], number> }
  >({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      if (!userId) return {}
      await queryClient.cancelQueries({
        queryKey: notificationKeys.byUser(userId),
      })
      const previous = queryClient.getQueryData<
        InfiniteData<NotificationRecord[], number>
      >(notificationKeys.byUser(userId))
      if (previous) {
        queryClient.setQueryData<InfiniteData<NotificationRecord[], number>>(
          notificationKeys.byUser(userId),
          {
            ...previous,
            pages: previous.pages.map((page) =>
              page.filter((item) => item.id !== id)
            ),
          }
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
    { previous?: InfiniteData<NotificationRecord[], number> }
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
      const previous = queryClient.getQueryData<
        InfiniteData<NotificationRecord[], number>
      >(notificationKeys.byUser(userId))
      queryClient.setQueryData<InfiniteData<NotificationRecord[], number>>(
        notificationKeys.byUser(userId),
        { pages: [[]], pageParams: [0] }
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
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import {
  chatService,
  type ChatRoomChannelHandle,
} from "../services/chatService"
import { relationshipService } from "../services/relationshipService"
import type {
  Activity,
  ChatActivityContent,
  ChatReplyRef,
} from "../types/activity"
import { useAuth } from "./useAuth"
import { useNotifications } from "./useNotifications"
import { relationshipKeys, useRelationship } from "./useRelationship"

export const CHAT_PAGE_SIZE = 30
const TYPING_THROTTLE_MS = 2_000
const TYPING_IDLE_MS = 2_500

export const chatKeys = {
  all: ["activities", "chat"] as const,
  byRelationship: (relationshipId?: number) =>
    [...chatKeys.all, relationshipId] as const,
}

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 3)}...`
}

export interface SendChatMessageInput {
  text: string
  replyTo?: ChatReplyRef
}

export function useChatMessages() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { relationship, currentMember } = useRelationship()
  const { notifyPartner } = useNotifications()

  const relationshipId = relationship?.id
  const currentUserId = user?.id
  const senderName = currentMember?.content?.name || "Your partner"

  const query = useInfiniteQuery<
    Activity[],
    Error,
    InfiniteData<Activity[], number>,
    ReturnType<typeof chatKeys.byRelationship>,
    number
  >({
    queryKey: chatKeys.byRelationship(relationshipId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      if (!relationshipId) return Promise.resolve([])
      return activityService.getActivitiesPage({
        relationshipId,
        types: ["chat"],
        page: pageParam,
        pageSize: CHAT_PAGE_SIZE,
      })
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < CHAT_PAGE_SIZE ? undefined : allPages.length,
    enabled: !!relationshipId,
  })

  // Pages arrive newest-first from Supabase; reverse into chronological order (oldest -> newest)
  const messages = useMemo(() => {
    const pages = query.data?.pages ?? []
    const seen = new Set<number>()
    const ordered: Activity<ChatActivityContent>[] = []

    for (let p = pages.length - 1; p >= 0; p--) {
      const page = pages[p]
      for (let i = page.length - 1; i >= 0; i--) {
        const item = page[i]
        if (item.type !== "chat" || seen.has(item.id)) continue
        const content = item.content as ChatActivityContent | null
        if (!content || typeof content.text !== "string") continue
        if (currentUserId && content.deletedFor?.includes(currentUserId)) {
          continue
        }
        seen.add(item.id)
        ordered.push(item as Activity<ChatActivityContent>)
      }
    }

    return ordered
  }, [query.data, currentUserId])

  const sendMessageMutation = useMutation<
    Activity,
    Error,
    SendChatMessageInput,
    {
      previousData?: InfiniteData<Activity[], number>
      optimisticId?: number
    }
  >({
    mutationFn: ({ text: rawText, replyTo }) => {
      if (!relationshipId) throw new Error("No active relationship found.")
      const text = rawText.trim()
      if (!text) throw new Error("Message cannot be empty.")
      const content: ChatActivityContent = replyTo ? { text, replyTo } : { text }
      return activityService.createActivity({
        relationshipId,
        type: "chat",
        content,
      })
    },
    onMutate: async ({ text: rawText, replyTo }) => {
      const text = rawText.trim()
      if (!relationshipId || !currentUserId || !text) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const optimisticId = -Date.now()
      const content: ChatActivityContent = replyTo ? { text, replyTo } : { text }
      const optimisticActivity: Activity<ChatActivityContent> = {
        id: optimisticId,
        relationship_id: relationshipId,
        user_id: currentUserId,
        type: "chat",
        content,
        created_at: new Date().toISOString(),
        updated_at: null,
      }

      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old || old.pages.length === 0) {
            return {
              pages: [[optimisticActivity]],
              pageParams: [0],
            }
          }
          const [firstPage, ...restPages] = old.pages
          return {
            ...old,
            pages: [[optimisticActivity, ...firstPage], ...restPages],
          }
        }
      )

      return { previousData, optimisticId }
    },
    onSuccess: (savedActivity, _input, context) => {
      if (!relationshipId || !context?.optimisticId) return
      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === context.optimisticId ? savedActivity : item
              )
            ),
          }
        }
      )
    },
    onError: (_err, _input, context) => {
      if (relationshipId && context?.previousData) {
        queryClient.setQueryData(
          chatKeys.byRelationship(relationshipId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const toggleReactionMutation = useMutation<
    Activity,
    Error,
    { activity: Activity<ChatActivityContent>; emoji: string },
    { previousData?: InfiniteData<Activity[], number> }
  >({
    mutationFn: ({ activity, emoji }) => {
      if (!currentUserId) throw new Error("You must be logged in to react.")
      const existingContent = activity.content ?? { text: "" }
      const nextReactions = { ...(existingContent.reactions ?? {}) }
      if (nextReactions[currentUserId] === emoji) {
        delete nextReactions[currentUserId]
      } else {
        nextReactions[currentUserId] = emoji
      }

      const nextContent: ChatActivityContent = {
        ...existingContent,
        reactions:
          Object.keys(nextReactions).length > 0 ? nextReactions : undefined,
      }

      return activityService.updateActivity(activity.id, nextContent)
    },
    onMutate: async ({ activity, emoji }) => {
      if (!relationshipId || !currentUserId) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const existingContent = activity.content ?? { text: "" }
      const nextReactions = { ...(existingContent.reactions ?? {}) }
      if (nextReactions[currentUserId] === emoji) {
        delete nextReactions[currentUserId]
      } else {
        nextReactions[currentUserId] = emoji
      }

      const nextContent: ChatActivityContent = {
        ...existingContent,
        reactions:
          Object.keys(nextReactions).length > 0 ? nextReactions : undefined,
      }

      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === activity.id
                  ? {
                      ...item,
                      content: nextContent,
                      updated_at: new Date().toISOString(),
                    }
                  : item
              )
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (relationshipId && context?.previousData) {
        queryClient.setQueryData(
          chatKeys.byRelationship(relationshipId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const editMessageMutation = useMutation<
    Activity,
    Error,
    { activity: Activity<ChatActivityContent>; text: string },
    { previousData?: InfiniteData<Activity[], number> }
  >({
    mutationFn: ({ activity, text: rawText }) => {
      const text = rawText.trim()
      if (!text) throw new Error("Message cannot be empty.")
      const existingContent = activity.content ?? { text: "" }
      const nextContent: ChatActivityContent = {
        ...existingContent,
        text,
        editedAt: new Date().toISOString(),
      }
      return activityService.updateActivity(activity.id, nextContent)
    },
    onMutate: async ({ activity, text: rawText }) => {
      const text = rawText.trim()
      if (!relationshipId || !text) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const existingContent = activity.content ?? { text: "" }
      const editedAt = new Date().toISOString()
      const nextContent: ChatActivityContent = {
        ...existingContent,
        text,
        editedAt,
      }

      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === activity.id
                  ? { ...item, content: nextContent, updated_at: editedAt }
                  : item
              )
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (relationshipId && context?.previousData) {
        queryClient.setQueryData(
          chatKeys.byRelationship(relationshipId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const deleteMessagesMutation = useMutation<
    void,
    Error,
    Activity<ChatActivityContent>[],
    { previousData?: InfiniteData<Activity[], number> }
  >({
    mutationFn: async (activities) => {
      if (!currentUserId) throw new Error("You must be logged in to delete.")
      await Promise.all(
        activities.map((activity) => {
          const existingContent = activity.content ?? { text: "" }
          const existingDeletedFor = existingContent.deletedFor ?? []
          const nextDeletedFor = existingDeletedFor.includes(currentUserId)
            ? existingDeletedFor
            : [...existingDeletedFor, currentUserId]
          const nextContent: ChatActivityContent = {
            ...existingContent,
            deletedFor: nextDeletedFor,
          }
          return activityService.updateActivity(activity.id, nextContent)
        })
      )
    },
    onMutate: async (activities) => {
      if (!relationshipId || !currentUserId) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const targetIds = new Set(activities.map((a) => a.id))

      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.filter((item) => !targetIds.has(item.id))
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (relationshipId && context?.previousData) {
        queryClient.setQueryData(
          chatKeys.byRelationship(relationshipId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const unsendMessagesMutation = useMutation<
    void,
    Error,
    number[],
    { previousData?: InfiniteData<Activity[], number> }
  >({
    mutationFn: async (activityIds) => {
      await Promise.all(
        activityIds.map((activityId) =>
          activityService.deleteActivity(activityId)
        )
      )
    },
    onMutate: async (activityIds) => {
      if (!relationshipId) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const targetIds = new Set(activityIds)

      queryClient.setQueryData<InfiniteData<Activity[], number>>(
        chatKeys.byRelationship(relationshipId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.filter((item) => !targetIds.has(item.id))
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _activityIds, context) => {
      if (relationshipId && context?.previousData) {
        queryClient.setQueryData(
          chatKeys.byRelationship(relationshipId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: chatKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const sendMessage = useCallback(
    async ({ text: rawText, replyTo }: SendChatMessageInput) => {
      const trimmed = rawText.trim()
      const saved = await sendMessageMutation.mutateAsync({
        text: trimmed,
        replyTo,
      })

      const title = replyTo
        ? replyTo.userId !== currentUserId
          ? `${senderName} replied to your message`
          : `${senderName} replied in chat`
        : `${senderName} sent a message`

      const body = replyTo
        ? `"${truncateText(trimmed, 60)}" · Re: "${truncateText(replyTo.text, 40)}"`
        : truncateText(trimmed, 100)

      void notifyPartner({
        type: "chat",
        title,
        body,
        url: "/chat",
        emoji: "💬",
      })

      return saved
    },
    [sendMessageMutation, notifyPartner, senderName, currentUserId]
  )

  const toggleReaction = useCallback(
    async ({
      activity,
      emoji,
    }: {
      activity: Activity<ChatActivityContent>
      emoji: string
    }) => {
      const isRemoving =
        !!currentUserId && activity.content?.reactions?.[currentUserId] === emoji

      const saved = await toggleReactionMutation.mutateAsync({
        activity,
        emoji,
      })

      if (!isRemoving) {
        const preview = truncateText(activity.content?.text ?? "", 80)
        const isPartnerMessage = activity.user_id !== currentUserId

        void notifyPartner({
          type: "chat",
          title: isPartnerMessage
            ? `${senderName} reacted ${emoji} to your message`
            : `${senderName} reacted ${emoji} to a message`,
          body: preview ? `"${preview}"` : "Reacted to a message",
          url: "/chat",
          emoji,
        })
      }

      return saved
    },
    [toggleReactionMutation, notifyPartner, senderName, currentUserId]
  )

  return {
    messages,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    editMessage: editMessageMutation.mutateAsync,
    isEditing: editMessageMutation.isPending,
    toggleReaction,
    deleteMessages: deleteMessagesMutation.mutate,
    unsendMessages: unsendMessagesMutation.mutate,
  }
}

export function useChatRoom(messages: Activity<ChatActivityContent>[]) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { relationship, currentMember, partnerMember } = useRelationship()

  const relationshipId = relationship?.id
  const currentUserId = user?.id
  const currentMemberId = currentMember?.id
  const currentMemberContent = currentMember?.content
  const currentReadAt = currentMemberContent?.chat_read_at
  const persistedPartnerReadAt = partnerMember?.content?.chat_read_at ?? null

  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const [livePartnerReadAt, setLivePartnerReadAt] = useState<string | null>(
    null
  )

  const channelRef = useRef<ChatRoomChannelHandle | null>(null)
  const lastSentAtRef = useRef<number>(0)
  const isCurrentlyTypingRef = useRef<boolean>(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastMarkedRef = useRef<string | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  // Ensure partner's persisted chat_read_at is fresh when opening ChatScreen
  useEffect(() => {
    if (!currentUserId) return
    void queryClient.invalidateQueries({
      queryKey: relationshipKeys.byUser(currentUserId),
    })
  }, [currentUserId, queryClient])

  useEffect(() => {
    if (!relationshipId || !currentUserId) {
      return
    }

    const handle = chatService.createChatRoomChannel(
      relationshipId,
      currentUserId,
      {
        onPartnerTypingChange: setIsPartnerTyping,
        onPartnerRead: (readAt) => {
          setLivePartnerReadAt((prev) => {
            if (!prev) return readAt
            return new Date(readAt).getTime() > new Date(prev).getTime()
              ? readAt
              : prev
          })
        },
      }
    )
    channelRef.current = handle

    return () => {
      clearIdleTimer()
      isCurrentlyTypingRef.current = false
      lastSentAtRef.current = 0
      channelRef.current = null
      setLivePartnerReadAt(null)
      handle.unsubscribe()
    }
  }, [relationshipId, currentUserId, clearIdleTimer])

  const latestPartnerMessageAt = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.user_id !== currentUserId && msg.id > 0) {
        return msg.created_at
      }
    }
    return null
  }, [messages, currentUserId])

  const markReadIfNeeded = useCallback(() => {
    if (!currentMemberId || !currentUserId || !latestPartnerMessageAt) return
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return
    }

    const latestMs = new Date(latestPartnerMessageAt).getTime()
    const currentReadMs = currentReadAt ? new Date(currentReadAt).getTime() : 0
    if (latestMs <= currentReadMs) return
    if (lastMarkedRef.current === latestPartnerMessageAt) return

    lastMarkedRef.current = latestPartnerMessageAt
    channelRef.current?.sendReadReceipt(latestPartnerMessageAt)

    void relationshipService
      .updateMemberContent(currentMemberId, {
        ...(currentMemberContent ?? {}),
        chat_read_at: latestPartnerMessageAt,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: relationshipKeys.byUser(currentUserId),
        })
      })
      .catch(() => {
        lastMarkedRef.current = null
      })
  }, [
    currentMemberId,
    currentUserId,
    currentMemberContent,
    currentReadAt,
    latestPartnerMessageAt,
    queryClient,
  ])

  useEffect(() => {
    markReadIfNeeded()
  }, [markReadIfNeeded])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markReadIfNeeded()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [markReadIfNeeded])

  const partnerReadAt = useMemo(() => {
    if (persistedPartnerReadAt && livePartnerReadAt) {
      return new Date(livePartnerReadAt).getTime() >
        new Date(persistedPartnerReadAt).getTime()
        ? livePartnerReadAt
        : persistedPartnerReadAt
    }
    return livePartnerReadAt ?? persistedPartnerReadAt
  }, [persistedPartnerReadAt, livePartnerReadAt])

  const stopTyping = useCallback(() => {
    clearIdleTimer()
    if (isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = false
      lastSentAtRef.current = 0
      channelRef.current?.sendTyping(false)
    }
  }, [clearIdleTimer])

  const handleTypingInput = useCallback(
    (hasContent: boolean) => {
      if (!hasContent) {
        stopTyping()
        return
      }

      const now = Date.now()
      if (
        !isCurrentlyTypingRef.current ||
        now - lastSentAtRef.current >= TYPING_THROTTLE_MS
      ) {
        isCurrentlyTypingRef.current = true
        lastSentAtRef.current = now
        channelRef.current?.sendTyping(true)
      }

      clearIdleTimer()
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null
        if (isCurrentlyTypingRef.current) {
          isCurrentlyTypingRef.current = false
          lastSentAtRef.current = 0
          channelRef.current?.sendTyping(false)
        }
      }, TYPING_IDLE_MS)
    },
    [clearIdleTimer, stopTyping]
  )

  return {
    isPartnerTyping,
    partnerReadAt,
    handleTypingInput,
    stopTyping,
  }
}

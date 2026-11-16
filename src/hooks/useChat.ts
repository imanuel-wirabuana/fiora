import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import { chatService, type TypingChannelHandle } from "../services/chatService"
import type { Activity, ChatActivityContent } from "../types/activity"
import { useAuth } from "./useAuth"
import { useNotifications } from "./useNotifications"
import { useRelationship } from "./useRelationship"

export const CHAT_PAGE_SIZE = 30
const TYPING_THROTTLE_MS = 2_000
const TYPING_IDLE_MS = 2_500

export const chatKeys = {
  all: ["activities", "chat"] as const,
  byRelationship: (relationshipId?: number) =>
    [...chatKeys.all, relationshipId] as const,
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
        seen.add(item.id)
        ordered.push(item as Activity<ChatActivityContent>)
      }
    }

    return ordered
  }, [query.data])

  const sendMessageMutation = useMutation<
    Activity,
    Error,
    string,
    {
      previousData?: InfiniteData<Activity[], number>
      optimisticId?: number
    }
  >({
    mutationFn: (rawText) => {
      if (!relationshipId) throw new Error("No active relationship found.")
      const text = rawText.trim()
      if (!text) throw new Error("Message cannot be empty.")
      return activityService.createActivity({
        relationshipId,
        type: "chat",
        content: { text },
      })
    },
    onMutate: async (rawText) => {
      const text = rawText.trim()
      if (!relationshipId || !currentUserId || !text) return {}

      await queryClient.cancelQueries({
        queryKey: chatKeys.byRelationship(relationshipId),
      })

      const previousData = queryClient.getQueryData<
        InfiniteData<Activity[], number>
      >(chatKeys.byRelationship(relationshipId))

      const optimisticId = -Date.now()
      const optimisticActivity: Activity<ChatActivityContent> = {
        id: optimisticId,
        relationship_id: relationshipId,
        user_id: currentUserId,
        type: "chat",
        content: { text },
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
    onSuccess: (savedActivity, _text, context) => {
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
    onError: (_err, _text, context) => {
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
    async (rawText: string) => {
      const trimmed = rawText.trim()
      const saved = await sendMessageMutation.mutateAsync(trimmed)

      void notifyPartner({
        type: "chat",
        title: `${senderName} sent a message`,
        body: trimmed.length > 100 ? `${trimmed.slice(0, 97)}...` : trimmed,
        url: "/chat",
        emoji: "💬",
      })

      return saved
    },
    [sendMessageMutation, notifyPartner, senderName]
  )

  return {
    messages,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    sendMessage,
    isSending: sendMessageMutation.isPending,
  }
}

export function useChatTyping() {
  const { user } = useAuth()
  const { relationship } = useRelationship()

  const relationshipId = relationship?.id
  const currentUserId = user?.id

  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const channelRef = useRef<TypingChannelHandle | null>(null)
  const lastSentAtRef = useRef<number>(0)
  const isCurrentlyTypingRef = useRef<boolean>(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!relationshipId || !currentUserId) {
      return
    }

    const handle = chatService.createTypingChannel(
      relationshipId,
      currentUserId,
      setIsPartnerTyping
    )
    channelRef.current = handle

    return () => {
      clearIdleTimer()
      isCurrentlyTypingRef.current = false
      lastSentAtRef.current = 0
      channelRef.current = null
      handle.unsubscribe()
    }
  }, [relationshipId, currentUserId, clearIdleTimer])

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
    handleTypingInput,
    stopTyping,
  }
}

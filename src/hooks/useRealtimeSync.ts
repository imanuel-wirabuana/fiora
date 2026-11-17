import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import { notificationService } from "../services/notificationService"
import { quizService } from "../services/quizService"
import { relationshipService } from "../services/relationshipService"
import { activityKeys } from "./useActivities"
import { useAuth } from "./useAuth"
import { chatKeys } from "./useChat"
import { notificationKeys } from "./useNotifications"
import { quizKeys } from "./useQuiz"
import { relationshipKeys, useRelationship } from "./useRelationship"
import { useHeadsUpStore } from "../stores/headsUpStore"

/**
 * Mounts a single set of Supabase Realtime subscriptions for the active user
 * and relationship, keeping TanStack Query caches synchronized without
 * opening duplicate channels per component.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const { relationship } = useRelationship()

  const userId = isAuthenticated ? user?.id : undefined
  const relationshipId = relationship?.id

  useEffect(() => {
    if (!userId) return

    const unsubscribeRelationship =
      relationshipService.subscribeToRelationshipChanges(
        { userId, relationshipId },
        () => {
          queryClient.invalidateQueries({
            queryKey: relationshipKeys.byUser(userId),
          })
        }
      )

    return () => {
      unsubscribeRelationship()
    }
  }, [userId, relationshipId, queryClient])

  useEffect(() => {
    if (!userId) return

    const unsubscribeNotifications =
      notificationService.subscribeToNotifications(
        userId,
        () => {
          queryClient.invalidateQueries({
            queryKey: notificationKeys.byUser(userId),
          })
        },
        (inserted) => {
          if (!inserted.content) return
          const path = window.location.pathname
          if (path === "/notification") return
          if (path === "/chat" && inserted.content.type === "chat") return
          useHeadsUpStore.getState().show({
            id: inserted.id,
            title: inserted.content.title || "Notification",
            body: inserted.content.body || undefined,
            emoji: inserted.content.emoji,
            type: inserted.content.type,
            url: inserted.content.url,
            notification: inserted,
          })
        }
      )

    return () => {
      unsubscribeNotifications()
    }
  }, [userId, queryClient])

  useEffect(() => {
    if (!relationshipId) return

    const unsubscribeActivities = activityService.subscribeToActivities(
      relationshipId,
      (activityType) => {
        if (activityType === "chat") {
          queryClient.invalidateQueries({
            queryKey: chatKeys.byRelationship(relationshipId),
          })
        } else if (activityType) {
          queryClient.invalidateQueries({
            queryKey: activityKeys.byRelationship(relationshipId),
          })
        } else {
          queryClient.invalidateQueries({
            queryKey: activityKeys.byRelationship(relationshipId),
          })
          queryClient.invalidateQueries({
            queryKey: chatKeys.byRelationship(relationshipId),
          })
        }
      }
    )

    const unsubscribeQuizAnswers = quizService.subscribeToQuizAnswers(
      relationshipId,
      () => {
        queryClient.invalidateQueries({
          queryKey: quizKeys.answers(relationshipId),
        })
      }
    )

    return () => {
      unsubscribeActivities()
      unsubscribeQuizAnswers()
    }
  }, [relationshipId, queryClient])
}


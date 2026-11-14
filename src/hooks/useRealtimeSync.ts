import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import { notificationService } from "../services/notificationService"
import { quizService } from "../services/quizService"
import { relationshipService } from "../services/relationshipService"
import { activityKeys } from "./useActivities"
import { useAuth } from "./useAuth"
import { notificationKeys } from "./useNotifications"
import { quizKeys } from "./useQuiz"
import { relationshipKeys, useRelationship } from "./useRelationship"

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

    const unsubscribeNotifications =
      notificationService.subscribeToNotifications(userId, () => {
        queryClient.invalidateQueries({
          queryKey: notificationKeys.byUser(userId),
        })
      })

    return () => {
      unsubscribeRelationship()
      unsubscribeNotifications()
    }
  }, [userId, relationshipId, queryClient])

  useEffect(() => {
    if (!relationshipId) return

    const unsubscribeActivities = activityService.subscribeToActivities(
      relationshipId,
      () => {
        queryClient.invalidateQueries({
          queryKey: activityKeys.byRelationship(relationshipId),
        })
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


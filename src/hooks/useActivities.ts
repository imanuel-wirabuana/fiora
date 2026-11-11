import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type {
  Activity,
  ActivityContent,
  ActivityType,
  JournalActivityContent,
  MoodActivityContent,
  NudgeActivityContent,
} from "../types/activity"

export const activityKeys = {
  all: ["activities"] as const,
  byRelationship: (relationshipId?: number) =>
    [...activityKeys.all, "relationship", relationshipId] as const,
}

export function useActivities() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { relationship, partnerMember } = useRelationship()
  const relationshipId = relationship?.id
  const currentUserId = user?.id

  // 1. Fetch activities for current relationship
  const query = useQuery<Activity[]>({
    queryKey: activityKeys.byRelationship(relationshipId),
    queryFn: () => {
      if (!relationshipId) return Promise.resolve([])
      return activityService.getActivities(relationshipId)
    },
    enabled: !!relationshipId,
  })

  // 2. Realtime listener
  useEffect(() => {
    if (!relationshipId) return

    const unsubscribe = activityService.subscribeToActivities(
      relationshipId,
      () => {
        queryClient.invalidateQueries({
          queryKey: activityKeys.byRelationship(relationshipId),
        })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [relationshipId, queryClient])

  const activities = useMemo(() => query.data ?? [], [query.data])

  // Derived selectors
  const moodActivities = useMemo(
    () =>
      activities.filter(
        (a): a is Activity<MoodActivityContent> => a.type === "mood"
      ),
    [activities]
  )

  const nudgeActivities = useMemo(
    () =>
      activities.filter(
        (a): a is Activity<NudgeActivityContent> => a.type === "nudge"
      ),
    [activities]
  )

  const journalActivities = useMemo(
    () =>
      activities.filter(
        (a): a is Activity<JournalActivityContent> => a.type === "journal"
      ),
    [activities]
  )

  const myLatestMood = useMemo(
    () =>
      moodActivities.find((a) => a.user_id === currentUserId) ?? null,
    [moodActivities, currentUserId]
  )

  const partnerLatestMood = useMemo(
    () =>
      partnerMember
        ? moodActivities.find((a) => a.user_id === partnerMember.user_id) ??
          null
        : null,
    [moodActivities, partnerMember]
  )

  const latestNudge = useMemo(
    () => (nudgeActivities.length > 0 ? nudgeActivities[0] : null),
    [nudgeActivities]
  )

  const partnerActivities = useMemo(
    () =>
      partnerMember
        ? activities.filter((a) => a.user_id === partnerMember.user_id)
        : [],
    [activities, partnerMember]
  )

  // 3. Mutations
  const createActivityMutation = useMutation<
    Activity,
    Error,
    { type: ActivityType; content: ActivityContent }
  >({
    mutationFn: ({ type, content }) => {
      if (!relationshipId) throw new Error("No active relationship found.")
      return activityService.createActivity({
        relationshipId,
        type,
        content,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })
    },
  })

  const updateActivityMutation = useMutation<
    Activity,
    Error,
    { activityId: number; content: ActivityContent }
  >({
    mutationFn: ({ activityId, content }) =>
      activityService.updateActivity(activityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })
    },
  })

  const deleteActivityMutation = useMutation<void, Error, number>({
    mutationFn: (activityId) => activityService.deleteActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })
    },
  })

  const logMood = async (content: MoodActivityContent) => {
    return createActivityMutation.mutateAsync({
      type: "mood",
      content,
    })
  }

  const sendNudge = async (content: NudgeActivityContent) => {
    return createActivityMutation.mutateAsync({
      type: "nudge",
      content,
    })
  }

  const createJournal = async (content: JournalActivityContent) => {
    return createActivityMutation.mutateAsync({
      type: "journal",
      content,
    })
  }

  return {
    activities,
    moodActivities,
    nudgeActivities,
    journalActivities,
    myLatestMood,
    partnerLatestMood,
    latestNudge,
    partnerActivities,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    createActivityMutation,
    updateActivityMutation,
    deleteActivityMutation,
    logMood,
    sendNudge,
    createJournal,
    updateJournal: updateActivityMutation.mutateAsync,
    deleteActivity: deleteActivityMutation.mutateAsync,
  }
}

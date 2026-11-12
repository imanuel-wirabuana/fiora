import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { activityService } from "../services/activityService"
import { useAuth } from "./useAuth"
import { useNotifications } from "./useNotifications"
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
  const { relationship, currentMember, partnerMember } = useRelationship()
  const { notifyPartner } = useNotifications()
  const senderName = currentMember?.content?.name || "Your partner"
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

  // Journals visible to the current user:
  // 1. Their own journals (both private and shared)
  // 2. Partner's shared journals (isShared === true)
  // (Partner's private journals are never shown)
  const visibleJournals = useMemo(() => {
    return activities.filter((a): a is Activity<JournalActivityContent> => {
      if (a.type !== "journal") return false
      const content = a.content as JournalActivityContent | null
      if (!content) return false
      if (a.user_id === currentUserId) return true
      return !!content.isShared
    })
  }, [activities, currentUserId])

  // Timeline activities:
  // Moods + Nudges ONLY (Journals are separated into their own dedicated screen)
  const timelineActivities = useMemo(() => {
    return activities.filter((a) => a.type === "mood" || a.type === "nudge")
  }, [activities])

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

  // Partner updates for NotificationScreen:
  // Moods + Nudges + ONLY Shared Journals
  const partnerActivities = useMemo(
    () =>
      partnerMember
        ? activities.filter((a) => {
            if (a.user_id !== partnerMember.user_id) return false
            if (a.type === "journal") {
              const content = a.content as JournalActivityContent | null
              return !!content?.isShared
            }
            return true
          })
        : [],
    [activities, partnerMember]
  )

  // 3. Optimistic Mutations
  const createActivityMutation = useMutation<
    Activity,
    Error,
    { type: ActivityType; content: ActivityContent },
    { previousActivities?: Activity[]; optimisticId?: number }
  >({
    mutationFn: ({ type, content }) => {
      if (!relationshipId) throw new Error("No active relationship found.")
      return activityService.createActivity({
        relationshipId,
        type,
        content,
      })
    },
    onMutate: async (newActivity) => {
      if (!relationshipId || !currentUserId) return {}

      await queryClient.cancelQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })

      const previousActivities =
        queryClient.getQueryData<Activity[]>(
          activityKeys.byRelationship(relationshipId)
        ) || []

      const optimisticId = -Date.now()
      const optimisticActivity: Activity = {
        id: optimisticId,
        relationship_id: relationshipId,
        user_id: currentUserId,
        type: newActivity.type,
        content: newActivity.content,
        created_at: new Date().toISOString(),
        updated_at: null,
      }

      queryClient.setQueryData<Activity[]>(
        activityKeys.byRelationship(relationshipId),
        [optimisticActivity, ...previousActivities]
      )

      return { previousActivities, optimisticId }
    },
    onSuccess: (savedActivity, _variables, context) => {
      if (!relationshipId) return
      const current = queryClient.getQueryData<Activity[]>(
        activityKeys.byRelationship(relationshipId)
      )
      if (current && context?.optimisticId) {
        // Swap out the negative placeholder ID with the actual saved record from Supabase
        queryClient.setQueryData<Activity[]>(
          activityKeys.byRelationship(relationshipId),
          current.map((a) => (a.id === context.optimisticId ? savedActivity : a))
        )
      }
    },
    onError: (_err, _newActivity, context) => {
      if (relationshipId && context?.previousActivities) {
        queryClient.setQueryData(
          activityKeys.byRelationship(relationshipId),
          context.previousActivities
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: activityKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const updateActivityMutation = useMutation<
    Activity,
    Error,
    { activityId: number; content: ActivityContent },
    { previousActivities?: Activity[] }
  >({
    mutationFn: ({ activityId, content }) =>
      activityService.updateActivity(activityId, content),
    onMutate: async ({ activityId, content }) => {
      if (!relationshipId) return {}

      await queryClient.cancelQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })

      const previousActivities =
        queryClient.getQueryData<Activity[]>(
          activityKeys.byRelationship(relationshipId)
        ) || []

      const updated = previousActivities.map((a) =>
        a.id === activityId
          ? { ...a, content, updated_at: new Date().toISOString() }
          : a
      )

      queryClient.setQueryData<Activity[]>(
        activityKeys.byRelationship(relationshipId),
        updated
      )

      return { previousActivities }
    },
    onSuccess: (savedActivity) => {
      if (!relationshipId) return
      const current = queryClient.getQueryData<Activity[]>(
        activityKeys.byRelationship(relationshipId)
      )
      if (current) {
        queryClient.setQueryData<Activity[]>(
          activityKeys.byRelationship(relationshipId),
          current.map((a) => (a.id === savedActivity.id ? savedActivity : a))
        )
      }
    },
    onError: (_err, _variables, context) => {
      if (relationshipId && context?.previousActivities) {
        queryClient.setQueryData(
          activityKeys.byRelationship(relationshipId),
          context.previousActivities
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: activityKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const deleteActivityMutation = useMutation<
    void,
    Error,
    number,
    { previousActivities?: Activity[] }
  >({
    mutationFn: (activityId) => activityService.deleteActivity(activityId),
    onMutate: async (activityId) => {
      if (!relationshipId) return {}

      await queryClient.cancelQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })

      const previousActivities =
        queryClient.getQueryData<Activity[]>(
          activityKeys.byRelationship(relationshipId)
        ) || []

      const filtered = previousActivities.filter((a) => a.id !== activityId)

      queryClient.setQueryData<Activity[]>(
        activityKeys.byRelationship(relationshipId),
        filtered
      )

      return { previousActivities }
    },
    onError: (_err, _activityId, context) => {
      if (relationshipId && context?.previousActivities) {
        queryClient.setQueryData(
          activityKeys.byRelationship(relationshipId),
          context.previousActivities
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: activityKeys.byRelationship(relationshipId),
        })
      }
    },
  })

  const logMood = async (content: MoodActivityContent) => {
    const saved = await createActivityMutation.mutateAsync({
      type: "mood",
      content,
    })

    void notifyPartner({
      type: "mood",
      title: `${senderName} updated mood: ${content.emoji} ${content.label}`,
      body: content.note ? `"${content.note}"` : "Checked in their mood",
      url: "/home",
      emoji: content.emoji,
    })

    return saved
  }

  const sendNudge = async (content: NudgeActivityContent) => {
    const saved = await createActivityMutation.mutateAsync({
      type: "nudge",
      content,
    })

    void notifyPartner({
      type: "nudge",
      title: `${senderName} sent you a nudge!`,
      body: `${content.emoji} "${content.label}"`,
      url: "/home",
      emoji: content.emoji,
    })

    return saved
  }

  const createJournal = async (content: JournalActivityContent) => {
    const payload: JournalActivityContent = {
      isShared: false,
      ...content,
    }
    const saved = await createActivityMutation.mutateAsync({
      type: "journal",
      content: payload,
    })

    if (payload.isShared) {
      void notifyPartner({
        type: "journal",
        title: `${senderName} added a new journal entry`,
        body: payload.title || "Shared a memory",
        url: "/journal",
        emoji: "📖",
      })
    }

    return saved
  }

  const toggleJournalPrivacy = async (
    activityId: number,
    currentContent: JournalActivityContent
  ) => {
    const nextShared = !currentContent.isShared
    const updatedContent: JournalActivityContent = {
      ...currentContent,
      isShared: nextShared,
    }
    const saved = await updateActivityMutation.mutateAsync({
      activityId,
      content: updatedContent,
    })

    if (nextShared) {
      void notifyPartner({
        type: "journal",
        title: `${senderName} shared a journal entry`,
        body: currentContent.title || "Shared a memory",
        url: "/journal",
        emoji: "📖",
      })
    }

    return saved
  }

  return {
    activities,
    timelineActivities,
    visibleJournals,
    moodActivities,
    nudgeActivities,
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
    toggleJournalPrivacy,
    updateJournal: updateActivityMutation.mutateAsync,
    deleteActivity: deleteActivityMutation.mutateAsync,
  }
}

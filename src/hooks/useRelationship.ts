import { useCallback, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { relationshipService } from "../services/relationshipService"
import { useAuth } from "./useAuth"
import {
  DEFAULT_DAILY_QUIZ_COUNT,
  DEFAULT_MOOD_OPTIONS,
  DEFAULT_NUDGE_OPTIONS,
} from "../lib/relationship"
import type {
  CreateRelationshipInput,
  JoinRelationshipInput,
  MemberLocation,
  Relationship,
  RelationshipMember,
  RelationshipMemberContent,
  UserRelationshipData,
} from "../types/relationship"

export const relationshipKeys = {
  all: ["relationship"] as const,
  byUser: (userId?: string) => [...relationshipKeys.all, "user", userId] as const,
}

export function useRelationship() {
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id

  // 1. Fetch user relationship
  const query = useQuery<UserRelationshipData | null>({
    queryKey: relationshipKeys.byUser(userId),
    queryFn: () => {
      if (!userId) return Promise.resolve(null)
      return relationshipService.getUserRelationship(userId)
    },
    enabled: !!isAuthenticated && !!userId,
  })

  const relationshipData = query.data ?? null
  const relationship = relationshipData?.relationship ?? null
  const currentMember = relationshipData?.currentMember ?? null
  const partnerMember = relationshipData?.partnerMember ?? null
  const members = relationshipData?.members ?? []
  const hasRelationship = !!relationship

  const moodOptions =
    relationship?.content?.moods && relationship.content.moods.length > 0
      ? relationship.content.moods
      : DEFAULT_MOOD_OPTIONS

  const nudgeOptions =
    relationship?.content?.nudges && relationship.content.nudges.length > 0
      ? relationship.content.nudges
      : DEFAULT_NUDGE_OPTIONS

  const anniversary = relationship?.content?.anniversary ?? null
  const locationSharing = Boolean(relationship?.content?.location_sharing)
  const dailyQuizCount =
    typeof relationship?.content?.daily_quiz_count === "number" &&
    relationship.content.daily_quiz_count > 0
      ? relationship.content.daily_quiz_count
      : DEFAULT_DAILY_QUIZ_COUNT
  const dailyQuizState = relationship?.content?.daily_quiz ?? null

  // 2. Realtime listener: invalidate query whenever changes occur on relationships or relationship_members
  useEffect(() => {
    if (!userId) return

    const unsubscribe = relationshipService.subscribeToRelationshipChanges(
      { userId, relationshipId: relationship?.id },
      () => {
        queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [userId, relationship?.id, queryClient])

  // 3. Mutations
  const createRelationshipMutation = useMutation<
    UserRelationshipData,
    Error,
    CreateRelationshipInput
  >({
    mutationFn: (input) => relationshipService.createRelationship(input),
    onSuccess: (newData) => {
      queryClient.setQueryData(relationshipKeys.byUser(userId), newData)
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const joinRelationshipMutation = useMutation<
    UserRelationshipData,
    Error,
    JoinRelationshipInput
  >({
    mutationFn: (input) => relationshipService.joinRelationship(input),
    onSuccess: (newData) => {
      queryClient.setQueryData(relationshipKeys.byUser(userId), newData)
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const regenerateInviteCodeMutation = useMutation<
    string,
    Error,
    number,
    { previousData?: UserRelationshipData | null }
  >({
    mutationFn: (relationshipId) => {
      const generatedCode = String(Math.floor(10000 + Math.random() * 90000))
      return relationshipService.regenerateInviteCode(relationshipId, generatedCode)
    },
    onMutate: async () => {
      if (!userId) return {}
      await queryClient.cancelQueries({ queryKey: relationshipKeys.byUser(userId) })
      const previousData = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )

      if (previousData?.relationship) {
        // Optimistically set a random 5-digit code or placeholder while generating
        const optimisticCode = String(Math.floor(10000 + Math.random() * 90000))
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...previousData,
            relationship: {
              ...previousData.relationship,
              invite_code: optimisticCode,
            },
          }
        )
      }

      return { previousData }
    },
    onSuccess: (newCode) => {
      if (!userId) return
      const current = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )
      if (current?.relationship) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...current,
            relationship: {
              ...current.relationship,
              invite_code: newCode,
            },
          }
        )
      }
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previousData !== undefined) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const updateRelationshipContentMutation = useMutation<
    Relationship,
    Error,
    { relationshipId: number; content: Partial<Relationship["content"]> },
    { previousData?: UserRelationshipData | null }
  >({
    mutationFn: ({ relationshipId, content }) =>
      relationshipService.updateRelationshipContent(relationshipId, content),
    onMutate: async ({ content }) => {
      if (!userId) return {}
      await queryClient.cancelQueries({ queryKey: relationshipKeys.byUser(userId) })
      const previousData = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )

      if (previousData?.relationship) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...previousData,
            relationship: {
              ...previousData.relationship,
              content: {
                ...(previousData.relationship.content || {}),
                ...content,
              },
            },
          }
        )
      }

      return { previousData }
    },
    onSuccess: (updatedRelationship) => {
      if (!userId) return
      const current = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )
      if (current) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...current,
            relationship: updatedRelationship,
          }
        )
      }
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previousData !== undefined) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const updateMemberContentMutation = useMutation<
    RelationshipMember,
    Error,
    { memberId: number; content: Partial<RelationshipMemberContent> },
    { previousData?: UserRelationshipData | null }
  >({
    mutationFn: ({ memberId, content }) =>
      relationshipService.updateMemberContent(memberId, content),
    onMutate: async ({ memberId, content }) => {
      if (!userId) return {}
      await queryClient.cancelQueries({ queryKey: relationshipKeys.byUser(userId) })
      const previousData = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )

      if (previousData) {
        const updatedCurrentMember =
          previousData.currentMember?.id === memberId
            ? {
                ...previousData.currentMember,
                content: {
                  ...(previousData.currentMember.content || {}),
                  ...content,
                },
              }
            : previousData.currentMember

        const updatedMembers = previousData.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                content: {
                  ...(m.content || {}),
                  ...content,
                },
              }
            : m
        )

        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...previousData,
            currentMember: updatedCurrentMember,
            members: updatedMembers,
          }
        )
      }

      return { previousData }
    },
    onSuccess: (updatedMember) => {
      if (!userId) return
      const current = queryClient.getQueryData<UserRelationshipData | null>(
        relationshipKeys.byUser(userId)
      )
      if (current) {
        const isCurrent = current.currentMember?.id === updatedMember.id
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          {
            ...current,
            currentMember: isCurrent ? updatedMember : current.currentMember,
            members: current.members.map((m) =>
              m.id === updatedMember.id ? updatedMember : m
            ),
          }
        )
      }
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previousData !== undefined) {
        queryClient.setQueryData(
          relationshipKeys.byUser(userId),
          context.previousData
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const updateMemberLocation = useCallback(
    (loc: MemberLocation) => {
      if (!relationship?.id) return Promise.resolve(null)
      return relationshipService.updateMemberLocation(relationship.id, loc)
    },
    [relationship?.id]
  )

  return {
    relationshipData,
    relationship,
    currentMember,
    partnerMember,
    members,
    hasRelationship,
    moodOptions,
    nudgeOptions,
    anniversary,
    locationSharing,
    dailyQuizCount,
    dailyQuizState,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    createRelationship: createRelationshipMutation.mutateAsync,
    createRelationshipMutation,
    joinRelationship: joinRelationshipMutation.mutateAsync,
    joinRelationshipMutation,
    regenerateInviteCodeMutation,
    updateRelationshipContentMutation,
    updateMemberContentMutation,
    updateMemberLocation,
  }
}

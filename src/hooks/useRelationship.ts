import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { relationshipService } from "../services/relationshipService"
import { useAuth } from "./useAuth"
import { DEFAULT_MOOD_OPTIONS, DEFAULT_NUDGE_OPTIONS } from "../lib/relationship"
import type {
  CreateRelationshipInput,
  JoinRelationshipInput,
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

  const regenerateInviteCodeMutation = useMutation<string, Error, number>({
    mutationFn: (relationshipId) =>
      relationshipService.regenerateInviteCode(relationshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const updateRelationshipContentMutation = useMutation<
    Relationship,
    Error,
    { relationshipId: number; content: Partial<Relationship["content"]> }
  >({
    mutationFn: ({ relationshipId, content }) =>
      relationshipService.updateRelationshipContent(relationshipId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

  const updateMemberContentMutation = useMutation<
    RelationshipMember,
    Error,
    { memberId: number; content: Partial<RelationshipMemberContent> }
  >({
    mutationFn: ({ memberId, content }) =>
      relationshipService.updateMemberContent(memberId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.byUser(userId) })
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })

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
  }
}

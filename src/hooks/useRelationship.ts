import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { relationshipService } from "../services/relationshipService"
import { useAuth } from "./useAuth"
import { DEFAULT_MOOD_OPTIONS } from "../lib/relationship"
import type {
  CreateRelationshipInput,
  JoinRelationshipInput,
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

  return {
    relationshipData,
    relationship,
    currentMember,
    partnerMember,
    members,
    hasRelationship,
    moodOptions,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    // Mutations
    createRelationship: createRelationshipMutation.mutateAsync,
    createRelationshipMutation,
    joinRelationship: joinRelationshipMutation.mutateAsync,
    joinRelationshipMutation,
  }
}


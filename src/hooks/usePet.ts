import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PET_ACTIVITIES, PET_MINIGAMES } from "@/lib/petConfig"
import {
  addPetXp,
  applyMinigameReward,
  applyStatDeltas,
  clampCosmeticTransform,
  completeActivityNow,
  createInitialPetContent,
  DEFAULT_PET_COSMETICS,
  getLevelFromXp,
  normalizePetContent,
  pickActivityEmoji,
} from "@/lib/petLogic"
import { activityService } from "@/services/activityService"
import { petService } from "@/services/petService"
import { usePetStore } from "@/stores/petStore"
import type { PetActivityContent } from "@/types/activity"
import type {
  ActivePetActivity,
  Pet,
  PetActivityType,
  PetContent,
  PetCosmeticSlot,
  PetCosmeticTransform,
  PetMinigameId,
  PetWearableSlot,
} from "@/types/pet"
import { activityKeys } from "./useActivities"
import { useRelationship } from "./useRelationship"

export const petKeys = {
  all: ["pets"] as const,
  byRelationship: (relationshipId?: number) =>
    [...petKeys.all, "relationship", relationshipId] as const,
}

export function usePet() {
  const queryClient = useQueryClient()
  const { relationship } = useRelationship()
  const relationshipId = relationship?.id
  const triggerCelebration = usePetStore((s) => s.triggerCelebration)
  const resetInteractionState = usePetStore((s) => s.resetInteractionState)

  const petQuery = useQuery<Pet | null>({
    queryKey: petKeys.byRelationship(relationshipId),
    queryFn: () => {
      if (!relationshipId) return Promise.resolve(null)
      return petService.getPetByRelationship(relationshipId)
    },
    enabled: !!relationshipId,
  })

  const rawPet = petQuery.data ?? null

  const liveContent = useMemo(
    () => normalizePetContent(rawPet?.content),
    [rawPet?.content]
  )

  const logPetActivity = useCallback(
    async (
      pet: Pet,
      action: PetActivityContent["action"],
      emoji: string,
      level?: number
    ) => {
      if (!relationshipId) return
      const content: PetActivityContent = {
        petId: pet.id,
        petName: pet.name,
        action,
        emoji,
        ...(level !== undefined ? { level } : {}),
      }
      await activityService.createActivity({
        relationshipId,
        type: "pet",
        content,
      })
      queryClient.invalidateQueries({
        queryKey: activityKeys.byRelationship(relationshipId),
      })
    },
    [relationshipId, queryClient]
  )

  const adoptPetMutation = useMutation<Pet, Error, string>({
    mutationFn: async (name) => {
      if (!relationshipId) {
        throw new Error("No active relationship")
      }
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error("Pet name is required")
      }
      const initialContent = createInitialPetContent()
      const created = await petService.createPet({
        relationshipId,
        name: trimmed,
        content: initialContent,
      })
      await logPetActivity(
        created,
        "adopt",
        "🐾",
        getLevelFromXp(initialContent.xp)
      )
      return created
    },
    onSuccess: (created) => {
      if (relationshipId) {
        queryClient.setQueryData(
          petKeys.byRelationship(relationshipId),
          created
        )
      }
    },
  })

  const updatePetMutation = useMutation<
    Pet,
    Error,
    {
      pet: Pet
      nextName?: string
      nextContent: PetContent
      completed?: ActivePetActivity | null
      renamed?: boolean
    },
    { previous: Pet | null | undefined }
  >({
    mutationFn: async ({ pet, nextName, nextContent, completed, renamed }) => {
      const updated = await petService.updatePet({
        id: pet.id,
        name: nextName,
        content: nextContent,
      })
      const nextLevel = getLevelFromXp(nextContent.xp)
      if (completed) {
        await logPetActivity(
          updated,
          completed.type,
          completed.emoji,
          nextLevel
        )
      } else if (renamed) {
        await logPetActivity(updated, "rename", "✏️", nextLevel)
      }
      return updated
    },
    onMutate: async ({ pet, nextName, nextContent }) => {
      if (!relationshipId) return { previous: undefined }
      const key = petKeys.byRelationship(relationshipId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Pet | null>(key)
      queryClient.setQueryData<Pet | null>(key, () => ({
        ...pet,
        name: nextName ?? pet.name,
        content: nextContent,
        updated_at: new Date().toISOString(),
      }))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (relationshipId && context?.previous !== undefined) {
        queryClient.setQueryData(
          petKeys.byRelationship(relationshipId),
          context.previous
        )
      }
    },
    onSuccess: (updated) => {
      if (relationshipId) {
        queryClient.setQueryData(
          petKeys.byRelationship(relationshipId),
          updated
        )
      }
    },
  })

  const startActivity = useCallback(
    (type: PetActivityType) => {
      if (!rawPet || liveContent.activeActivity || liveContent.isSleeping) return
      const emoji = pickActivityEmoji(type)
      const nowIso = new Date().toISOString()

      resetInteractionState()
      const nextContent: PetContent = {
        ...liveContent,
        lastUpdatedAt: nowIso,
        activeActivity: {
          type,
          startedAt: nowIso,
          emoji,
        },
      }
      updatePetMutation.mutate({ pet: rawPet, nextContent })
    },
    [rawPet, liveContent, resetInteractionState, updatePetMutation]
  )

  const completeActiveActivity = useCallback(() => {
    if (!rawPet || !liveContent.activeActivity) return
    const currentNow = Date.now()
    const { content: nextContent, completedActivity: completed } =
      completeActivityNow(liveContent, currentNow)
    if (!completed) return

    triggerCelebration(completed.emoji)
    resetInteractionState()
    updatePetMutation.mutate({
      pet: rawPet,
      nextContent,
      completed,
    })
  }, [
    rawPet,
    liveContent,
    triggerCelebration,
    resetInteractionState,
    updatePetMutation,
  ])

  const toggleSleep = useCallback(() => {
    if (!rawPet) return
    const nextSleeping = !liveContent.isSleeping
    const nowIso = new Date().toISOString()
    resetInteractionState()
    const nextContent: PetContent = {
      ...liveContent,
      lastUpdatedAt: nowIso,
      activeActivity: null,
      isSleeping: nextSleeping,
      sleep_at: nextSleeping ? nowIso : null,
    }
    updatePetMutation.mutate({ pet: rawPet, nextContent })
  }, [rawPet, liveContent, resetInteractionState, updatePetMutation])

  const completeCare = useCallback(
    (mode: "eat" | "bath", emoji?: string) => {
      if (!rawPet) return
      const config = PET_ACTIVITIES[mode]
      const nowIso = new Date().toISOString()
      const nextStats = applyStatDeltas(liveContent.stats, config.statDeltas)
      const nextXp = addPetXp(liveContent.xp, config.xpReward)
      const usedEmoji = emoji ?? pickActivityEmoji(mode)

      triggerCelebration(usedEmoji)
      resetInteractionState()

      const nextContent: PetContent = {
        ...liveContent,
        xp: nextXp,
        stats: nextStats,
        lastUpdatedAt: nowIso,
        activeActivity: null,
        ...(mode === "eat" ? { lastAteAt: nowIso } : {}),
      }

      updatePetMutation.mutate({
        pet: rawPet,
        nextContent,
        completed: {
          type: mode,
          startedAt: nowIso,
          emoji: usedEmoji,
        },
      })
    },
    [
      rawPet,
      liveContent,
      triggerCelebration,
      resetInteractionState,
      updatePetMutation,
    ]
  )

  const cancelActivity = useCallback(() => {
    if (!rawPet || !liveContent.activeActivity) return
    const config = PET_ACTIVITIES[liveContent.activeActivity.type]
    if (!config.cancellable) return

    resetInteractionState()
    const nextContent: PetContent = {
      ...liveContent,
      activeActivity: null,
      lastUpdatedAt: new Date().toISOString(),
    }
    updatePetMutation.mutate({ pet: rawPet, nextContent })
  }, [rawPet, liveContent, resetInteractionState, updatePetMutation])

  const renamePet = useCallback(
    async (name: string) => {
      if (!rawPet) return
      const trimmed = name.trim()
      if (!trimmed || trimmed === rawPet.name) return
      await updatePetMutation.mutateAsync({
        pet: rawPet,
        nextName: trimmed,
        nextContent: liveContent,
        renamed: true,
      })
    },
    [rawPet, liveContent, updatePetMutation]
  )

  const completeMinigame = useCallback(
    async (gameId: PetMinigameId, score: number) => {
      if (!rawPet) return null
      const result = applyMinigameReward(liveContent, gameId, score)
      const game = PET_MINIGAMES[gameId]
      triggerCelebration(game.icon)
      resetInteractionState()
      await updatePetMutation.mutateAsync({
        pet: rawPet,
        nextContent: result.content,
        completed: {
          type: "play",
          startedAt: new Date().toISOString(),
          emoji: game.icon,
        },
      })
      return result
    },
    [
      rawPet,
      liveContent,
      triggerCelebration,
      resetInteractionState,
      updatePetMutation,
    ]
  )

  const equipCosmetic = useCallback(
    (slot: PetCosmeticSlot, itemId: string | null) => {
      if (!rawPet) return
      const nowIso = new Date().toISOString()
      const currentCosmetics = liveContent.cosmetics ?? DEFAULT_PET_COSMETICS
      const nextContent: PetContent = {
        ...liveContent,
        lastUpdatedAt: nowIso,
        cosmetics: {
          ...currentCosmetics,
          [slot]: itemId,
        },
      }
      updatePetMutation.mutate({ pet: rawPet, nextContent })
    },
    [rawPet, liveContent, updatePetMutation]
  )

  const updateCosmeticTransform = useCallback(
    (slot: PetWearableSlot, transform: PetCosmeticTransform | null) => {
      if (!rawPet) return
      const nowIso = new Date().toISOString()
      const nextTransforms = { ...(liveContent.cosmeticTransforms ?? {}) }
      if (transform === null) {
        delete nextTransforms[slot]
      } else {
        nextTransforms[slot] = clampCosmeticTransform(transform)
      }
      const nextContent: PetContent = {
        ...liveContent,
        lastUpdatedAt: nowIso,
        cosmeticTransforms: nextTransforms,
      }
      updatePetMutation.mutate({ pet: rawPet, nextContent })
    },
    [rawPet, liveContent, updatePetMutation]
  )

  return {
    pet: rawPet,
    content: liveContent,
    isLoading: petQuery.isLoading,
    error: petQuery.error,
    adoptPet: adoptPetMutation.mutateAsync,
    isAdopting: adoptPetMutation.isPending,
    startActivity,
    completeActiveActivity,
    completeCare,
    completeMinigame,
    equipCosmetic,
    updateCosmeticTransform,
    toggleSleep,
    cancelActivity,
    renamePet,
    isUpdating: updatePetMutation.isPending,
  }
}

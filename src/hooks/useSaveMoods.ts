import { useMutation, useQueryClient } from "@tanstack/react-query"
import { distributeMoodScores, MAX_MOODS, MIN_MOODS } from "@/lib/relationship"
import { aiService, type MoodDraftInput } from "@/services/aiService"
import { relationshipService } from "@/services/relationshipService"
import { relationshipKeys } from "@/hooks/useRelationship"
import type { MoodOption } from "@/types/relationship"

export interface SaveMoodsVariables {
  relationshipId: number
  moods: MoodDraftInput[]
  prompt?: string
}

/**
 * Scores (or prompt-manages) moods with AI, sorts good-to-bad with evenly spaced scores, and saves to Supabase.
 */
export function useSaveMoods() {
  const queryClient = useQueryClient()

  return useMutation<MoodOption[], Error, SaveMoodsVariables>({
    mutationFn: async ({ relationshipId, moods, prompt }) => {
      const trimmedPrompt = prompt?.trim()

      const nextMoods = trimmedPrompt
        ? await aiService.manageMoodsWithPrompt(moods, trimmedPrompt)
        : await aiService.scoreMoods(moods)

      if (nextMoods.length < MIN_MOODS || nextMoods.length > MAX_MOODS) {
        throw new Error(
          `Please keep between ${MIN_MOODS} and ${MAX_MOODS} moods.`
        )
      }

      const sortedMoods = distributeMoodScores(nextMoods)

      await relationshipService.updateRelationshipContent(relationshipId, {
        moods: sortedMoods,
      })

      return sortedMoods
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: relationshipKeys.all })
    },
  })
}

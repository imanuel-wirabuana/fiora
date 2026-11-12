import { supabase } from "./supabase"
import type { Quiz, QuizAnswer, SubmitQuizAnswerInput } from "../types/quiz"

export const quizService = {
  async getQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("id", { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data as Quiz[]) || []
  },

  async getRelationshipAnswers(relationshipId: number): Promise<QuizAnswer[]> {
    const { data, error } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data as QuizAnswer[]) || []
  },

  async submitAnswer(input: SubmitQuizAnswerInput): Promise<QuizAnswer> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error("You must be logged in to submit an answer.")
    }

    const userId = authData.user.id

    // Check if current user already submitted for this quiz and relationship
    const { data: existingAnswer, error: findError } = await supabase
      .from("quiz_answers")
      .select("*")
      .eq("relationship_id", input.relationshipId)
      .eq("quiz_id", input.quizId)
      .eq("user_id", userId)
      .maybeSingle()

    if (findError) {
      throw new Error(findError.message)
    }

    if (existingAnswer) {
      const { data, error } = await supabase
        .from("quiz_answers")
        .update({
          content: input.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAnswer.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data as QuizAnswer
    }

    const { data, error } = await supabase
      .from("quiz_answers")
      .insert({
        relationship_id: input.relationshipId,
        quiz_id: input.quizId,
        user_id: userId,
        content: input.content,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as QuizAnswer
  },

  subscribeToQuizAnswers(
    relationshipId: number,
    onChange: () => void
  ): () => void {
    const uniqueId = Math.random().toString(36).slice(2, 9)
    const channelName = `realtime-quiz-answers-${relationshipId}-${uniqueId}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_answers",
          filter: `relationship_id=eq.${relationshipId}`,
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}


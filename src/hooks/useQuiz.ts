import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { quizService } from "../services/quizService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type { Quiz, QuizAnswer, QuizAnswerContent } from "../types/quiz"

export const quizKeys = {
  all: ["quiz"] as const,
  quizzes: () => [...quizKeys.all, "list"] as const,
  answers: (relationshipId?: number) =>
    [...quizKeys.all, "answers", relationshipId] as const,
}

// Simple deterministic hash for a string to an integer
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function useQuiz() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { relationship, partnerMember } = useRelationship()
  const relationshipId = relationship?.id
  const currentUserId = user?.id

  // 1. Fetch available quizzes
  const quizzesQuery = useQuery<Quiz[]>({
    queryKey: quizKeys.quizzes(),
    queryFn: () => quizService.getQuizzes(),
  })

  // 2. Fetch all answers for relationship
  const answersQuery = useQuery<QuizAnswer[]>({
    queryKey: quizKeys.answers(relationshipId),
    queryFn: () => {
      if (!relationshipId) return Promise.resolve([])
      return quizService.getRelationshipAnswers(relationshipId)
    },
    enabled: !!relationshipId,
  })

  // 3. Realtime subscription to answers
  useEffect(() => {
    if (!relationshipId) return

    const unsubscribe = quizService.subscribeToQuizAnswers(
      relationshipId,
      () => {
        queryClient.invalidateQueries({
          queryKey: quizKeys.answers(relationshipId),
        })
      }
    )

    return () => {
      unsubscribe()
    }
  }, [relationshipId, queryClient])

  const quizzes = useMemo(() => quizzesQuery.data ?? [], [quizzesQuery.data])
  const answers = useMemo(() => answersQuery.data ?? [], [answersQuery.data])

  // 4. Determine Today's Quiz
  const todayQuiz = useMemo(() => {
    if (quizzes.length === 0 || !relationshipId) return null

    const today = new Date()

    // A. Check if either partner already answered a quiz today
    const answerToday = answers.find((a) =>
      isSameDay(new Date(a.created_at), today)
    )
    if (answerToday) {
      const activeQuiz = quizzes.find((q) => q.id === answerToday.quiz_id)
      if (activeQuiz) return activeQuiz
    }

    // B. Check if there is an in-progress quiz (e.g. one partner answered previously, but partner hasn't answered yet)
    // Find quiz IDs where both partners have answered (considered completed)
    const answersByQuiz = new Map<number, Set<string>>()
    for (const a of answers) {
      if (!answersByQuiz.has(a.quiz_id)) {
        answersByQuiz.set(a.quiz_id, new Set())
      }
      answersByQuiz.get(a.quiz_id)!.add(a.user_id)
    }

    // If there's a pending quiz where current or partner answered but not both, pick that first to complete it
    const pendingQuizId = Array.from(answersByQuiz.entries()).find(
      ([, userIds]) => userIds.size === 1
    )?.[0]

    if (pendingQuizId) {
      const pendingQuiz = quizzes.find((q) => q.id === pendingQuizId)
      if (pendingQuiz) return pendingQuiz
    }

    // C. Filter out fully completed quizzes
    const completedQuizIds = new Set(
      Array.from(answersByQuiz.entries())
        .filter(([, userIds]) => userIds.size >= (partnerMember ? 2 : 1))
        .map(([quizId]) => quizId)
    )

    const availableQuizzes = quizzes.filter((q) => !completedQuizIds.has(q.id))

    if (availableQuizzes.length === 0) {
      // If all are completed, fallback to none or loop (return null to show all completed)
      return null
    }

    // D. Deterministic pseudo-random selection for today based on relationshipId + date string
    const dateStr = format(today, "yyyy-MM-dd")
    const seed = hashString(`${relationshipId}-${dateStr}`)
    const selectedIndex = seed % availableQuizzes.length
    return availableQuizzes[selectedIndex]
  }, [quizzes, answers, relationshipId, partnerMember])

  // Answers for today's active quiz
  const myAnswer = useMemo(() => {
    if (!todayQuiz || !currentUserId) return null
    return (
      answers.find(
        (a) => a.quiz_id === todayQuiz.id && a.user_id === currentUserId
      ) ?? null
    )
  }, [todayQuiz, currentUserId, answers])

  const partnerAnswer = useMemo(() => {
    if (!todayQuiz || !partnerMember) return null
    return (
      answers.find(
        (a) =>
          a.quiz_id === todayQuiz.id && a.user_id === partnerMember.user_id
      ) ?? null
    )
  }, [todayQuiz, partnerMember, answers])

  const isBothAnswered = Boolean(myAnswer && partnerAnswer)

  // 5. Submit mutation
  const submitAnswerMutation = useMutation<
    QuizAnswer,
    Error,
    QuizAnswerContent,
    { previousAnswers?: QuizAnswer[]; optimisticAnswer?: QuizAnswer }
  >({
    mutationFn: (content) => {
      if (!relationshipId || !todayQuiz) {
        throw new Error("No active relationship or daily quiz.")
      }
      return quizService.submitAnswer({
        quizId: todayQuiz.id,
        relationshipId,
        content,
      })
    },
    onMutate: async (newContent) => {
      if (!relationshipId || !todayQuiz || !currentUserId) return {}

      await queryClient.cancelQueries({
        queryKey: quizKeys.answers(relationshipId),
      })

      const previousAnswers =
        queryClient.getQueryData<QuizAnswer[]>(
          quizKeys.answers(relationshipId)
        ) || []

      const optimisticAnswer: QuizAnswer = {
        id: -Date.now(),
        quiz_id: todayQuiz.id,
        relationship_id: relationshipId,
        user_id: currentUserId,
        content: newContent,
        created_at: new Date().toISOString(),
        updated_at: null,
      }

      // Replace if already exists in answers, else prepend
      const existingIdx = previousAnswers.findIndex(
        (a) => a.quiz_id === todayQuiz.id && a.user_id === currentUserId
      )
      const nextAnswers =
        existingIdx >= 0
          ? previousAnswers.map((a, i) =>
              i === existingIdx ? optimisticAnswer : a
            )
          : [optimisticAnswer, ...previousAnswers]

      queryClient.setQueryData<QuizAnswer[]>(
        quizKeys.answers(relationshipId),
        nextAnswers
      )

      return { previousAnswers, optimisticAnswer }
    },
    onError: (_err, _vars, context) => {
      if (relationshipId && context?.previousAnswers) {
        queryClient.setQueryData(
          quizKeys.answers(relationshipId),
          context.previousAnswers
        )
      }
    },
    onSettled: () => {
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: quizKeys.answers(relationshipId),
        })
      }
    },
  })

  return {
    todayQuiz,
    myAnswer,
    partnerAnswer,
    isBothAnswered,
    isLoading: quizzesQuery.isLoading || answersQuery.isLoading,
    isSubmitting: submitAnswerMutation.isPending,
    submitAnswer: (selectedOption: string, optionIndex?: number) =>
      submitAnswerMutation.mutateAsync({ selectedOption, optionIndex }),
  }
}


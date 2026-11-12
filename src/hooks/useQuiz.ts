import { useEffect, useMemo, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { quizService } from "../services/quizService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type {
  DailyQuizItem,
  Quiz,
  QuizAnswer,
  QuizAnswerContent,
  QuizTimelineEntry,
} from "../types/quiz"

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
  const {
    relationship,
    partnerMember,
    dailyQuizCount,
    dailyQuizState,
    updateRelationshipContentMutation,
  } = useRelationship()
  const relationshipId = relationship?.id
  const currentUserId = user?.id
  const lastSyncedDateRef = useRef<string | null>(null)

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

  const todayStr = format(new Date(), "yyyy-MM-dd")

  // Group answers by quiz_id
  const answersByQuiz = useMemo(() => {
    const map = new Map<number, QuizAnswer[]>()
    for (const a of answers) {
      const list = map.get(a.quiz_id)
      if (list) {
        list.push(a)
      } else {
        map.set(a.quiz_id, [a])
      }
    }
    return map
  }, [answers])

  // Candidate pool of eligible quizzes (excluding quizzes completed on previous days)
  const candidatePool = useMemo<Quiz[]>(() => {
    if (quizzes.length === 0 || !relationshipId) return []

    const today = new Date()
    const answeredTodayQuizzes: Quiz[] = []
    const pendingFromBeforeQuizzes: Quiz[] = []
    const unansweredQuizzes: Quiz[] = []

    for (const q of quizzes) {
      const qAnswers = answersByQuiz.get(q.id) ?? []

      if (qAnswers.length === 0) {
        unansweredQuizzes.push(q)
        continue
      }

      const hasAnswerToday = qAnswers.some((a) =>
        isSameDay(new Date(a.created_at), today)
      )

      if (hasAnswerToday) {
        answeredTodayQuizzes.push(q)
        continue
      }

      // Answered on a previous day: include only if still waiting on one partner
      const uniqueUsers = new Set(qAnswers.map((a) => a.user_id))
      const requiredCount = partnerMember ? 2 : 1
      if (uniqueUsers.size < requiredCount) {
        pendingFromBeforeQuizzes.push(q)
      }
    }

    const shuffledUnanswered = [...unansweredQuizzes].sort((a, b) => {
      const hashA = hashString(`${relationshipId}-${todayStr}-${a.id}`)
      const hashB = hashString(`${relationshipId}-${todayStr}-${b.id}`)
      return hashA - hashB
    })

    return [
      ...answeredTodayQuizzes,
      ...pendingFromBeforeQuizzes,
      ...shuffledUnanswered,
    ]
  }, [quizzes, answersByQuiz, relationshipId, partnerMember, todayStr])

  const hasValidLockedStateToday =
    dailyQuizState?.date === todayStr &&
    Array.isArray(dailyQuizState.quiz_ids) &&
    dailyQuizState.quiz_ids.length > 0

  // 4. Persist locked quiz_ids into relationship.content.daily_quiz when not yet locked for today
  useEffect(() => {
    if (
      !relationshipId ||
      quizzesQuery.isLoading ||
      answersQuery.isLoading ||
      hasValidLockedStateToday
    ) {
      return
    }

    if (candidatePool.length === 0) return

    const syncKey = `${relationshipId}-${todayStr}`
    if (lastSyncedDateRef.current === syncKey) return
    lastSyncedDateRef.current = syncKey

    const initialQuizIds = candidatePool
      .slice(0, dailyQuizCount)
      .map((q) => q.id)

    updateRelationshipContentMutation.mutate({
      relationshipId,
      content: {
        daily_quiz: {
          date: todayStr,
          quiz_ids: initialQuizIds,
        },
      },
    })
  }, [
    relationshipId,
    quizzesQuery.isLoading,
    answersQuery.isLoading,
    hasValidLockedStateToday,
    candidatePool,
    dailyQuizCount,
    todayStr,
    updateRelationshipContentMutation,
  ])

  // 5. Resolve Today's Quizzes from locked daily_quiz.quiz_ids (or candidatePool while syncing)
  const todayQuizzes = useMemo<DailyQuizItem[]>(() => {
    if (quizzes.length === 0 || !relationshipId) return []

    const quizById = new Map<number, Quiz>(quizzes.map((q) => [q.id, q]))

    const selectedQuizzes: Quiz[] = hasValidLockedStateToday
      ? dailyQuizState!.quiz_ids
          .map((id) => quizById.get(id))
          .filter((q): q is Quiz => Boolean(q))
      : candidatePool.slice(0, dailyQuizCount)

    return selectedQuizzes.map((quiz) => {
      const qAnswers = answersByQuiz.get(quiz.id) ?? []
      const myAnswer = currentUserId
        ? qAnswers.find((a) => a.user_id === currentUserId) ?? null
        : null
      const partnerAnswer = partnerMember
        ? qAnswers.find((a) => a.user_id === partnerMember.user_id) ?? null
        : null
      const isBothAnswered = Boolean(myAnswer && partnerAnswer)
      const isMatched = Boolean(
        isBothAnswered &&
          myAnswer?.content?.selectedOption ===
            partnerAnswer?.content?.selectedOption
      )

      return {
        quiz,
        myAnswer,
        partnerAnswer,
        isBothAnswered,
        isMatched,
      }
    })
  }, [
    quizzes,
    relationshipId,
    hasValidLockedStateToday,
    dailyQuizState,
    candidatePool,
    dailyQuizCount,
    answersByQuiz,
    currentUserId,
    partnerMember,
  ])

  // Helper to update daily_quiz_count AND resize today's locked daily_quiz.quiz_ids together
  const updateDailyQuizCount = (newCount: number) => {
    if (!relationshipId || newCount === dailyQuizCount) return

    const currentIds = hasValidLockedStateToday ? dailyQuizState!.quiz_ids : []
    let nextQuizIds: number[]

    if (newCount <= currentIds.length) {
      nextQuizIds = currentIds.slice(0, newCount)
    } else {
      const existingSet = new Set(currentIds)
      const additionalIds = candidatePool
        .filter((q) => !existingSet.has(q.id))
        .slice(0, newCount - currentIds.length)
        .map((q) => q.id)
      nextQuizIds = [...currentIds, ...additionalIds]
    }

    updateRelationshipContentMutation.mutate({
      relationshipId,
      content: {
        daily_quiz_count: newCount,
        daily_quiz: {
          date: todayStr,
          quiz_ids: nextQuizIds,
        },
      },
    })
  }

  const totalCount = todayQuizzes.length
  const myAnsweredCount = useMemo(
    () => todayQuizzes.filter((item) => !!item.myAnswer).length,
    [todayQuizzes]
  )
  const partnerAnsweredCount = useMemo(
    () => todayQuizzes.filter((item) => !!item.partnerAnswer).length,
    [todayQuizzes]
  )
  const bothAnsweredCount = useMemo(
    () => todayQuizzes.filter((item) => item.isBothAnswered).length,
    [todayQuizzes]
  )
  const matchedCount = useMemo(
    () => todayQuizzes.filter((item) => item.isMatched).length,
    [todayQuizzes]
  )

  const isAllMyAnswered = totalCount > 0 && myAnsweredCount === totalCount
  const isAllBothAnswered = totalCount > 0 && bothAnsweredCount === totalCount

  // All quizzes that have at least one answer in this relationship for timeline display
  const answeredQuizzes = useMemo<QuizTimelineEntry[]>(() => {
    if (quizzes.length === 0 || answers.length === 0) return []

    const quizById = new Map<number, Quiz>(quizzes.map((q) => [q.id, q]))
    const entries: QuizTimelineEntry[] = []

    for (const [quizId, qAnswers] of answersByQuiz.entries()) {
      const quiz = quizById.get(quizId)
      if (!quiz) continue

      const myAnswer = currentUserId
        ? qAnswers.find((a) => a.user_id === currentUserId) ?? null
        : null
      const partnerAnswer = partnerMember
        ? qAnswers.find((a) => a.user_id === partnerMember.user_id) ?? null
        : null
      const isBothAnswered = Boolean(myAnswer && partnerAnswer)

      // Only include fully completed quizzes on timeline
      if (!isBothAnswered) continue

      const isMatched = Boolean(
        myAnswer?.content?.selectedOption ===
          partnerAnswer?.content?.selectedOption
      )

      // Determine latest answer timestamp
      const timestamps = qAnswers
        .map((a) => new Date(a.created_at).getTime())
        .filter((t) => !isNaN(t))
      const latestTimestamp =
        timestamps.length > 0 ? Math.max(...timestamps) : 0

      entries.push({
        quiz,
        myAnswer,
        partnerAnswer,
        isBothAnswered,
        isMatched,
        latestAnsweredAt: new Date(latestTimestamp).toISOString(),
      })
    }

    return entries.sort(
      (a, b) =>
        new Date(b.latestAnsweredAt).getTime() -
        new Date(a.latestAnsweredAt).getTime()
    )
  }, [quizzes, answers, answersByQuiz, currentUserId, partnerMember])

  // 6. Submit mutation
  const submitAnswerMutation = useMutation<
    QuizAnswer,
    Error,
    { quizId: number; content: QuizAnswerContent },
    { previousAnswers?: QuizAnswer[]; optimisticAnswer?: QuizAnswer }
  >({
    mutationFn: ({ quizId, content }) => {
      if (!relationshipId) {
        throw new Error("No active relationship.")
      }
      return quizService.submitAnswer({
        quizId,
        relationshipId,
        content,
      })
    },
    onMutate: async ({ quizId, content }) => {
      if (!relationshipId || !currentUserId) return {}

      await queryClient.cancelQueries({
        queryKey: quizKeys.answers(relationshipId),
      })

      const previousAnswers =
        queryClient.getQueryData<QuizAnswer[]>(
          quizKeys.answers(relationshipId)
        ) || []

      const optimisticAnswer: QuizAnswer = {
        id: -Date.now(),
        quiz_id: quizId,
        relationship_id: relationshipId,
        user_id: currentUserId,
        content,
        created_at: new Date().toISOString(),
        updated_at: null,
      }

      const existingIdx = previousAnswers.findIndex(
        (a) => a.quiz_id === quizId && a.user_id === currentUserId
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
    todayQuizzes,
    answeredQuizzes,
    totalCount,
    myAnsweredCount,
    partnerAnsweredCount,
    bothAnsweredCount,
    matchedCount,
    isAllMyAnswered,
    isAllBothAnswered,
    isLoading: quizzesQuery.isLoading || answersQuery.isLoading,
    isSubmitting: submitAnswerMutation.isPending,
    updateDailyQuizCount,
    submitAnswer: (
      quizId: number,
      selectedOption: string,
      optionIndex?: number
    ) =>
      submitAnswerMutation.mutateAsync({
        quizId,
        content: { selectedOption, optionIndex },
      }),
  }
}

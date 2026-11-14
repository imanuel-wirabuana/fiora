import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns"
import { resolveInsightDateBounds } from "@/lib/insightDate"
import { clampMoodScore } from "@/lib/relationship"
import { activityService } from "@/services/activityService"
import type {
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"
import type {
  InsightDateFilter,
  InsightSummary,
  MoodTrendPoint,
  NudgeActivityPoint,
  QuizInsightSummary,
} from "@/types/insight"
import { activityKeys } from "./useActivities"
import { useAuth } from "./useAuth"
import { useQuiz } from "./useQuiz"
import { useRelationship } from "./useRelationship"

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

export function useInsights(filter: InsightDateFilter) {
  const { user } = useAuth()
  const { relationship } = useRelationship()
  const { answeredQuizzes, isLoading: isQuizLoading } = useQuiz()

  const relationshipId = relationship?.id
  const currentUserId = user?.id
  const bounds = useMemo(() => resolveInsightDateBounds(filter), [filter])
  const startDateIso = bounds.startDate?.toISOString()
  const endDateIso = bounds.endDate?.toISOString()

  const activitiesQuery = useQuery({
    queryKey: activityKeys.insights(relationshipId, bounds.queryKey),
    queryFn: () => {
      if (!relationshipId) return Promise.resolve([])
      return activityService.getActivitiesInRange({
        relationshipId,
        types: ["mood", "nudge"],
        startDate: startDateIso,
        endDate: endDateIso,
      })
    },
    enabled: !!relationshipId,
  })

  const moodScoreMap = useMemo(() => {
    const byEmoji = new Map<string, number>()
    const byLabel = new Map<string, number>()
    const moods = relationship?.content?.moods ?? []
    for (const option of moods) {
      if (typeof option.score === "number") {
        byEmoji.set(option.emoji, option.score)
        byLabel.set(option.label.toLowerCase(), option.score)
      }
    }
    return { byEmoji, byLabel }
  }, [relationship?.content?.moods])

  const { moodTrend, nudgeActivity, summary } = useMemo(() => {
    const activities = activitiesQuery.data ?? []
    const today = startOfDay(new Date())

    let intervalStart = bounds.startDate ? startOfDay(bounds.startDate) : undefined
    let intervalEnd = bounds.endDate ? startOfDay(bounds.endDate) : today

    if (!intervalStart) {
      if (activities.length > 0) {
        intervalStart = startOfDay(new Date(activities[0].created_at))
      } else {
        intervalStart = subDays(today, 6)
      }
    }

    if (intervalStart > intervalEnd) {
      intervalEnd = intervalStart
    }

    const days = eachDayOfInterval({
      start: intervalStart,
      end: intervalEnd,
    })

    const dateFormat = days.length <= 7 ? "EEE" : "MMM d"

    const moodBuckets = new Map<
      string,
      { myScores: number[]; partnerScores: number[] }
    >()
    const nudgeBuckets = new Map<string, { sent: number; received: number }>()

    for (const day of days) {
      const key = format(day, "yyyy-MM-dd")
      moodBuckets.set(key, { myScores: [], partnerScores: [] })
      nudgeBuckets.set(key, { sent: 0, received: 0 })
    }

    const allMyScores: number[] = []
    const allPartnerScores: number[] = []
    let moodCount = 0
    let nudgeSentCount = 0
    let nudgeReceivedCount = 0
    const nudgeFrequency = new Map<
      string,
      { emoji: string; label: string; count: number }
    >()

    for (const activity of activities) {
      const dayKey = format(new Date(activity.created_at), "yyyy-MM-dd")
      const isMine = activity.user_id === currentUserId

      if (activity.type === "mood") {
        const content = activity.content as MoodActivityContent | null
        if (!content) continue

        const rawScore =
          typeof content.score === "number"
            ? content.score
            : (moodScoreMap.byEmoji.get(content.emoji) ??
              moodScoreMap.byLabel.get(content.label?.toLowerCase() ?? ""))

        if (typeof rawScore !== "number") continue

        const resolvedScore = clampMoodScore(rawScore)

        moodCount += 1
        const bucket = moodBuckets.get(dayKey)
        if (isMine) {
          allMyScores.push(resolvedScore)
          bucket?.myScores.push(resolvedScore)
        } else {
          allPartnerScores.push(resolvedScore)
          bucket?.partnerScores.push(resolvedScore)
        }
      } else if (activity.type === "nudge") {
        const content = activity.content as NudgeActivityContent | null
        const bucket = nudgeBuckets.get(dayKey)

        if (isMine) {
          nudgeSentCount += 1
          if (bucket) bucket.sent += 1
        } else {
          nudgeReceivedCount += 1
          if (bucket) bucket.received += 1
        }

        if (content?.emoji && content?.label) {
          const freqKey = `${content.emoji}|${content.label}`
          const existing = nudgeFrequency.get(freqKey)
          if (existing) {
            existing.count += 1
          } else {
            nudgeFrequency.set(freqKey, {
              emoji: content.emoji,
              label: content.label,
              count: 1,
            })
          }
        }
      }
    }

    const moodTrendData: MoodTrendPoint[] = days.map((day) => {
      const key = format(day, "yyyy-MM-dd")
      const bucket = moodBuckets.get(key)
      const myAvg =
        bucket && bucket.myScores.length > 0
          ? roundToTwoDecimals(
              bucket.myScores.reduce((a, b) => a + b, 0) /
                bucket.myScores.length
            )
          : null
      const partnerAvg =
        bucket && bucket.partnerScores.length > 0
          ? roundToTwoDecimals(
              bucket.partnerScores.reduce((a, b) => a + b, 0) /
                bucket.partnerScores.length
            )
          : null

      return {
        dateKey: key,
        label: format(day, dateFormat),
        me: myAvg,
        partner: partnerAvg,
      }
    })

    const nudgeActivityData: NudgeActivityPoint[] = days.map((day) => {
      const key = format(day, "yyyy-MM-dd")
      const bucket = nudgeBuckets.get(key)
      return {
        dateKey: key,
        label: format(day, dateFormat),
        sent: bucket?.sent ?? 0,
        received: bucket?.received ?? 0,
      }
    })

    const combinedScores = [...allMyScores, ...allPartnerScores]
    const avgMoodScore =
      combinedScores.length > 0
        ? roundToTwoDecimals(
            combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length
          )
        : null
    const myAvgMoodScore =
      allMyScores.length > 0
        ? roundToTwoDecimals(
            allMyScores.reduce((a, b) => a + b, 0) / allMyScores.length
          )
        : null
    const partnerAvgMoodScore =
      allPartnerScores.length > 0
        ? roundToTwoDecimals(
            allPartnerScores.reduce((a, b) => a + b, 0) /
              allPartnerScores.length
          )
        : null

    let topNudge: { emoji: string; label: string; count: number } | null = null
    for (const item of nudgeFrequency.values()) {
      if (!topNudge || item.count > topNudge.count) {
        topNudge = item
      }
    }

    const summaryData: InsightSummary = {
      avgMoodScore,
      myAvgMoodScore,
      partnerAvgMoodScore,
      moodCount,
      nudgeSentCount,
      nudgeReceivedCount,
      nudgeTotalCount: nudgeSentCount + nudgeReceivedCount,
      topNudgeEmoji: topNudge?.emoji ?? null,
      topNudgeLabel: topNudge?.label ?? null,
    }

    return {
      moodTrend: moodTrendData,
      nudgeActivity: nudgeActivityData,
      summary: summaryData,
    }
  }, [activitiesQuery.data, bounds.endDate, bounds.startDate, currentUserId, moodScoreMap])

  const quizSummary = useMemo<QuizInsightSummary>(() => {
    const filteredQuizzes = answeredQuizzes.filter((q) => {
      const answeredAt = new Date(q.latestAnsweredAt)
      if (bounds.startDate && answeredAt < bounds.startDate) return false
      if (bounds.endDate && answeredAt > bounds.endDate) return false
      return true
    })

    const totalAnswered = filteredQuizzes.length
    const matchedCount = filteredQuizzes.filter((q) => q.isMatched).length
    const matchRate =
      totalAnswered > 0 ? Math.round((matchedCount / totalAnswered) * 100) : null

    return {
      totalAnswered,
      matchedCount,
      matchRate,
    }
  }, [answeredQuizzes, bounds.endDate, bounds.startDate])

  return {
    moodTrend,
    nudgeActivity,
    summary,
    quizSummary,
    bounds,
    isLoading: activitiesQuery.isLoading || isQuizLoading,
  }
}

export type InsightDateMode = "daily" | "weekly" | "monthly" | "range" | "all"

export interface InsightDateFilter {
  mode: InsightDateMode
  date: Date
  rangeStart: Date
  rangeEnd: Date
}

export interface MoodTrendPoint {
  dateKey: string
  label: string
  me: number | null
  partner: number | null
}

export interface NudgeActivityPoint {
  dateKey: string
  label: string
  sent: number
  received: number
}

export interface QuizInsightSummary {
  totalAnswered: number
  matchedCount: number
  matchRate: number | null
}

export interface InsightSummary {
  avgMoodScore: number | null
  myAvgMoodScore: number | null
  partnerAvgMoodScore: number | null
  moodCount: number
  nudgeSentCount: number
  nudgeReceivedCount: number
  nudgeTotalCount: number
  topNudgeEmoji: string | null
  topNudgeLabel: string | null
}

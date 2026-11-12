import type { Activity } from "./activity"
import type { QuizTimelineEntry } from "./quiz"

export type TimelineFilterType = "all" | "mood" | "nudge" | "quiz"

export type TimelineItem =
  | {
      id: string
      type: "mood" | "nudge"
      created_at: string
      activity: Activity
    }
  | {
      id: string
      type: "quiz"
      created_at: string
      quizEntry: QuizTimelineEntry
    }


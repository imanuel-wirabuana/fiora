import type { Activity } from "./activity"

export type TimelineFilterType = "all" | "mood" | "nudge"

export interface TimelineItem {
  id: string
  type: "mood" | "nudge"
  created_at: string
  activity: Activity
}


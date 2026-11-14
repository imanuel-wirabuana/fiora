import { HeartHandshake, Smile, Sparkles } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import type { InsightSummary, QuizInsightSummary } from "@/types/insight"

interface InsightKpiGridProps {
  summary: InsightSummary
  quizSummary: QuizInsightSummary
}

export function InsightKpiGrid({ summary, quizSummary }: InsightKpiGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomItem
        variant="default"
        title="Avg Mood"
        icon={<Smile className="size-3.5 text-primary" />}
        className="gap-1.5 rounded-2xl p-3"
        headerClassName="gap-1.5"
      >
        <div className="text-base font-bold tracking-tight">
          {summary.avgMoodScore !== null ? (
            <>
              {summary.avgMoodScore.toFixed(2)}
              <span className="text-[10px] font-normal text-muted-foreground">
                /1.0
              </span>
            </>
          ) : (
            "—"
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {summary.moodCount} {summary.moodCount === 1 ? "log" : "logs"}
        </p>
      </CustomItem>

      <CustomItem
        variant="soft"
        title="Nudges"
        icon={<HeartHandshake className="size-3.5 text-primary" />}
        className="gap-1.5 rounded-2xl p-3"
        headerClassName="gap-1.5"
      >
        <div className="text-base font-bold tracking-tight">
          {summary.nudgeTotalCount}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {summary.nudgeSentCount}s · {summary.nudgeReceivedCount}r
        </p>
      </CustomItem>

      <CustomItem
        variant="outline"
        title="Quiz Sync"
        icon={<Sparkles className="size-3.5" />}
        className="gap-1.5 rounded-2xl p-3"
        headerClassName="gap-1.5"
      >
        <div className="text-base font-bold tracking-tight">
          {quizSummary.matchRate !== null ? `${quizSummary.matchRate}%` : "—"}
        </div>
        <p className="text-[10px] text-primary/80">
          {quizSummary.matchedCount}/{quizSummary.totalAnswered} match
        </p>
      </CustomItem>
    </div>
  )
}

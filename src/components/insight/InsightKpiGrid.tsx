import { memo } from "react"
import { HeartHandshake, Smile, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CustomItem } from "@/components/CustomItem"
import type { InsightSummary, QuizInsightSummary } from "@/types/insight"

interface InsightKpiGridProps {
  summary: InsightSummary
  quizSummary: QuizInsightSummary
}

export const InsightKpiGrid = memo(function InsightKpiGrid({
  summary,
  quizSummary,
}: InsightKpiGridProps) {
  const { t } = useTranslation("insight")

  return (
    <div className="grid grid-cols-3 gap-2">
      <CustomItem
        variant="default"
        title={t("kpi.avgMood")}
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
          {t("kpi.moodLogs", { count: summary.moodCount })}
        </p>
      </CustomItem>

      <CustomItem
        variant="soft"
        title={t("kpi.nudges")}
        icon={<HeartHandshake className="size-3.5 text-primary" />}
        className="gap-1.5 rounded-2xl p-3"
        headerClassName="gap-1.5"
      >
        <div className="text-base font-bold tracking-tight">
          {summary.nudgeTotalCount}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t("kpi.nudgeBreakdown", {
            sent: summary.nudgeSentCount,
            received: summary.nudgeReceivedCount,
          })}
        </p>
      </CustomItem>

      <CustomItem
        variant="outline"
        title={t("kpi.quizSync")}
        icon={<Sparkles className="size-3.5" />}
        className="gap-1.5 rounded-2xl p-3"
        headerClassName="gap-1.5"
      >
        <div className="text-base font-bold tracking-tight">
          {quizSummary.matchRate !== null ? `${quizSummary.matchRate}%` : "—"}
        </div>
        <p className="text-[10px] text-primary/80">
          {t("kpi.quizMatch", {
            matched: quizSummary.matchedCount,
            total: quizSummary.totalAnswered,
          })}
        </p>
      </CustomItem>
    </div>
  )
})

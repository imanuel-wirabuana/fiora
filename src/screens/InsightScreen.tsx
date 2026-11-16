import { useState } from "react"
import { subDays } from "date-fns"
import {
  InsightDatePicker,
  InsightKpiGrid,
  InsightTimelineSection,
  MoodTrendChart,
  NudgeActivityChart,
} from "@/components/insight"
import { InsightScreenSkeleton } from "@/components/ScreenSkeletons"
import { useInsights } from "@/hooks/useInsights"
import { useRelationship } from "@/hooks/useRelationship"
import type { InsightDateFilter } from "@/types/insight"

export function InsightScreen() {
  const [dateFilter, setDateFilter] = useState<InsightDateFilter>(() => {
    const today = new Date()
    return {
      mode: "weekly",
      date: today,
      rangeStart: subDays(today, 6),
      rangeEnd: today,
    }
  })

  const { currentMember, partnerMember } = useRelationship()
  const { moodTrend, nudgeActivity, summary, quizSummary, bounds, isLoading } =
    useInsights(dateFilter)

  const myName = currentMember?.content?.name || "You"
  const myGender = currentMember?.content?.gender
  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerGender = partnerMember?.content?.gender

  if (isLoading) {
    return <InsightScreenSkeleton />
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 pt-3 pb-20 sm:max-w-2xl">
      <InsightDatePicker value={dateFilter} onChange={setDateFilter} />

      <InsightKpiGrid summary={summary} quizSummary={quizSummary} />

      <div className="grid grid-cols-2 gap-2.5">
        <MoodTrendChart
          data={moodTrend}
          myName={myName}
          partnerName={partnerName}
          myGender={myGender}
          partnerGender={partnerGender}
        />

        <NudgeActivityChart
          data={nudgeActivity}
          topEmoji={summary.topNudgeEmoji}
          topLabel={summary.topNudgeLabel}
          myGender={myGender}
          partnerGender={partnerGender}
        />
      </div>

      <InsightTimelineSection
        startDate={bounds.startDate}
        endDate={bounds.endDate}
      />
    </section>
  )
}

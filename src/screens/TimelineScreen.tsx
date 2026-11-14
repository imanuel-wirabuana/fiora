import { useState, useMemo } from "react"
import { isSameDay } from "date-fns"
import {
  type FilterType,
  TimelineFeedSection,
  TimelineFilterSection,
} from "@/components/timeline"
import { useInfiniteTimelineActivities } from "@/hooks/useActivities"
import { useQuiz } from "@/hooks/useQuiz"
import type { TimelineItem } from "@/types/timeline"

export function TimelineScreen() {
  const {
    timelineActivities,
    isLoading: isActivitiesLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTimelineActivities()
  const { answeredQuizzes, isLoading: isQuizLoading } = useQuiz()

  const [typeFilter, setTypeFilter] = useState<FilterType>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Merge timelineActivities (moods + nudges) and answeredQuizzes into unified TimelineItem[]
  const allTimelineItems = useMemo<TimelineItem[]>(() => {
    const activityItems: TimelineItem[] = timelineActivities.map((a) => ({
      id: `activity-${a.id}`,
      type: a.type as "mood" | "nudge",
      created_at: a.created_at,
      activity: a,
    }))

    const quizItems: TimelineItem[] = answeredQuizzes.map((q) => ({
      id: `quiz-${q.quiz.id}`,
      type: "quiz",
      created_at: q.latestAnsweredAt,
      quizEntry: q,
    }))

    return [...activityItems, ...quizItems].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [timelineActivities, answeredQuizzes])

  const filteredItems = useMemo(() => {
    return allTimelineItems.filter((item) => {
      // 1. Type filter
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false
      }
      // 2. Date filter
      if (selectedDate) {
        if (!isSameDay(new Date(item.created_at), selectedDate)) {
          return false
        }
      }
      return true
    })
  }, [allTimelineItems, typeFilter, selectedDate])

  return (
    <section className="flex flex-col gap-3">
      <TimelineFilterSection
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isCalendarOpen={isCalendarOpen}
        setIsCalendarOpen={setIsCalendarOpen}
      />
      <TimelineFeedSection
        items={filteredItems}
        isLoading={isActivitiesLoading || isQuizLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        selectedDate={selectedDate}
      />
    </section>
  )
}

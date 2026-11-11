import { useState, useMemo } from "react"
import { isSameDay } from "date-fns"
import {
  type FilterType,
  TimelineFeedSection,
  TimelineFilterSection,
} from "@/components/timeline"
import { useActivities } from "@/hooks/useActivities"

export function TimelineScreen() {
  const { timelineActivities, isLoading } = useActivities()

  const [typeFilter, setTypeFilter] = useState<FilterType>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Identify dates that have activities for calendar dots/styling
  const activeDays = useMemo(() => {
    return timelineActivities.map((a) => new Date(a.created_at))
  }, [timelineActivities])

  const filteredActivities = useMemo(() => {
    return timelineActivities.filter((activity) => {
      // 1. Type filter
      if (typeFilter !== "all" && activity.type !== typeFilter) {
        return false
      }
      // 2. Date filter
      if (selectedDate) {
        if (!isSameDay(new Date(activity.created_at), selectedDate)) {
          return false
        }
      }
      return true
    })
  }, [timelineActivities, typeFilter, selectedDate])

  return (
    <section className="flex flex-col gap-3">
      <TimelineFilterSection
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isCalendarOpen={isCalendarOpen}
        setIsCalendarOpen={setIsCalendarOpen}
        activeDays={activeDays}
      />
      <TimelineFeedSection
        activities={filteredActivities}
        isLoading={isLoading}
        selectedDate={selectedDate}
      />
    </section>
  )
}

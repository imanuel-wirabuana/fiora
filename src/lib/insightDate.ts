import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import type { InsightDateFilter } from "@/types/insight"

export interface ResolvedInsightBounds {
  startDate?: Date
  endDate?: Date
  label: string
  queryKey: string
}

function clampToToday(date: Date, today: Date): Date {
  return date > today ? today : date
}

export function resolveInsightDateBounds(
  filter: InsightDateFilter
): ResolvedInsightBounds {
  const maxEnd = endOfDay(new Date())

  switch (filter.mode) {
    case "daily": {
      const target = clampToToday(filter.date, maxEnd)
      const startDate = startOfDay(target)
      const endDate = endOfDay(target)
      return {
        startDate,
        endDate,
        label: format(target, "MMM d, yyyy"),
        queryKey: `daily-${format(startDate, "yyyy-MM-dd")}`,
      }
    }
    case "weekly": {
      const target = clampToToday(filter.date, maxEnd)
      const startDate = startOfWeek(target, { weekStartsOn: 1 })
      const endDate = clampToToday(
        endOfWeek(target, { weekStartsOn: 1 }),
        maxEnd
      )
      return {
        startDate,
        endDate,
        label: `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`,
        queryKey: `weekly-${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}`,
      }
    }
    case "monthly": {
      const target = clampToToday(filter.date, maxEnd)
      const startDate = startOfMonth(target)
      const endDate = clampToToday(endOfMonth(target), maxEnd)
      return {
        startDate,
        endDate,
        label: format(target, "MMM yyyy"),
        queryKey: `monthly-${format(startDate, "yyyy-MM")}_${format(endDate, "yyyy-MM-dd")}`,
      }
    }
    case "range": {
      const clampedStart = clampToToday(filter.rangeStart, maxEnd)
      const clampedEnd = clampToToday(filter.rangeEnd, maxEnd)
      const [rawStart, rawEnd] =
        clampedStart <= clampedEnd
          ? [clampedStart, clampedEnd]
          : [clampedEnd, clampedStart]
      const startDate = startOfDay(rawStart)
      const endDate = endOfDay(rawEnd)
      const label = isSameDay(startDate, endDate)
        ? format(startDate, "MMM d, yyyy")
        : `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`
      return {
        startDate,
        endDate,
        label,
        queryKey: `range-${format(startDate, "yyyy-MM-dd")}_${format(endDate, "yyyy-MM-dd")}`,
      }
    }
    case "all":
    default:
      return {
        startDate: undefined,
        endDate: maxEnd,
        label: "All time",
        queryKey: "all",
      }
  }
}

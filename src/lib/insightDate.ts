import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import i18n, { getDateFnsLocale } from "@/lib/i18n"
import type { InsightDateFilter, InsightDateMode } from "@/types/insight"

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
  const locale = getDateFnsLocale()

  switch (filter.mode) {
    case "daily": {
      const target = clampToToday(filter.date, maxEnd)
      const startDate = startOfDay(target)
      const endDate = endOfDay(target)
      return {
        startDate,
        endDate,
        label: format(target, "MMM d, yyyy", { locale }),
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
        label: `${format(startDate, "MMM d", { locale })} – ${format(endDate, "MMM d", { locale })}`,
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
        label: format(target, "MMM yyyy", { locale }),
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
        ? format(startDate, "MMM d, yyyy", { locale })
        : `${format(startDate, "MMM d", { locale })} – ${format(endDate, "MMM d", { locale })}`
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
        label: i18n.t("insight:datePicker.allTime"),
        queryKey: "all",
      }
  }
}

export interface InsightBucket {
  key: string
  label: string
}

export type InsightGranularity = "2h" | "day" | "week" | "month"

const TWO_HOUR_SLOTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const

/**
 * Determine chart bucket granularity from the active filter mode and date span.
 */
export function resolveInsightGranularity(
  mode: InsightDateMode,
  intervalStart: Date,
  intervalEnd: Date
): InsightGranularity {
  if (mode === "daily" || isSameDay(intervalStart, intervalEnd)) {
    return "2h"
  }
  const daySpan = differenceInCalendarDays(intervalEnd, intervalStart) + 1
  if (daySpan <= 31) return "day"
  if (daySpan <= 120) return "week"
  return "month"
}

/**
 * Build ordered chart buckets for the resolved granularity.
 */
export function buildInsightBuckets(
  mode: InsightDateMode,
  intervalStart: Date,
  intervalEnd: Date
): { granularity: InsightGranularity; buckets: InsightBucket[] } {
  const locale = getDateFnsLocale()
  const granularity = resolveInsightGranularity(mode, intervalStart, intervalEnd)

  if (granularity === "2h") {
    const dayKey = format(intervalStart, "yyyy-MM-dd")
    return {
      granularity,
      buckets: TWO_HOUR_SLOTS.map((hour) => {
        const hh = String(hour).padStart(2, "0")
        return {
          key: `${dayKey}T${hh}`,
          label: `${hh}:00`,
        }
      }),
    }
  }

  if (granularity === "week") {
    const weeks = eachWeekOfInterval(
      { start: intervalStart, end: intervalEnd },
      { weekStartsOn: 1 }
    )
    return {
      granularity,
      buckets: weeks.map((weekStart) => ({
        key: format(weekStart, "yyyy-MM-dd"),
        label: format(weekStart, "MMM d", { locale }),
      })),
    }
  }

  if (granularity === "month") {
    const months = eachMonthOfInterval({ start: intervalStart, end: intervalEnd })
    return {
      granularity,
      buckets: months.map((monthStart) => ({
        key: format(monthStart, "yyyy-MM"),
        label: format(monthStart, "MMM yy", { locale }),
      })),
    }
  }

  const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd })
  const dateFormat = days.length <= 7 ? "EEE" : "MMM d"
  return {
    granularity,
    buckets: days.map((day) => ({
      key: format(day, "yyyy-MM-dd"),
      label: format(day, dateFormat, { locale }),
    })),
  }
}

/**
 * Map a timestamp to its corresponding bucket key for the given granularity.
 */
export function getInsightBucketKey(
  date: Date,
  granularity: InsightGranularity
): string {
  switch (granularity) {
    case "2h": {
      const slotHour = Math.floor(date.getHours() / 2) * 2
      const hh = String(slotHour).padStart(2, "0")
      return `${format(date, "yyyy-MM-dd")}T${hh}`
    }
    case "week":
      return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
    case "month":
      return format(startOfMonth(date), "yyyy-MM")
    case "day":
    default:
      return format(date, "yyyy-MM-dd")
  }
}

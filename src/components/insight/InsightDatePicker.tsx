import { useMemo, useState } from "react"
import {
  endOfWeek,
  format,
  getDaysInMonth,
  startOfWeek,
} from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { CustomTabs, type CustomTabItem } from "@/components/CustomTabs"
import { WheelPicker, type WheelOption } from "@/components/pickers"
import { PickerDrawer } from "@/components/pickers/PickerDrawer"
import { Button } from "@/components/ui/button"
import { resolveInsightDateBounds } from "@/lib/insightDate"
import { cn } from "@/lib/utils"
import type { InsightDateFilter, InsightDateMode } from "@/types/insight"

interface InsightDatePickerProps {
  value: InsightDateFilter
  onChange: (next: InsightDateFilter) => void
}

const MODE_OPTIONS: CustomTabItem<InsightDateMode>[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "range", label: "Range" },
  { value: "all", label: "All" },
]

function buildYearOptions(
  minYear: number,
  maxYear: number
): WheelOption<string>[] {
  const options: WheelOption<string>[] = []
  for (let year = minYear; year <= maxYear; year += 1) {
    options.push({ value: String(year), label: String(year) })
  }
  return options
}

function buildMonthOptions(maxMonth: number): WheelOption<string>[] {
  return Array.from({ length: maxMonth + 1 }, (_, index) => ({
    value: String(index),
    label: format(new Date(2024, index, 1), "MMM"),
  }))
}

function buildDayOptions(
  year: number,
  month: number,
  maxDayOverride?: number
): WheelOption<string>[] {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1))
  const count =
    typeof maxDayOverride === "number"
      ? Math.min(daysInMonth, maxDayOverride)
      : daysInMonth
  return Array.from({ length: count }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }))
}

function clampDateToToday(
  year: number,
  month: number,
  day: number,
  today: Date
): Date {
  const maxYear = today.getFullYear()
  const clampedYear = Math.min(year, maxYear)
  const maxMonth = clampedYear === maxYear ? today.getMonth() : 11
  const clampedMonth = Math.min(Math.max(month, 0), maxMonth)
  const daysInMonth = getDaysInMonth(new Date(clampedYear, clampedMonth, 1))
  const maxDay =
    clampedYear === maxYear && clampedMonth === today.getMonth()
      ? Math.min(daysInMonth, today.getDate())
      : daysInMonth
  const clampedDay = Math.min(Math.max(day, 1), maxDay)
  return new Date(clampedYear, clampedMonth, clampedDay)
}

export function InsightDatePicker({ value, onChange }: InsightDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<InsightDateFilter>(value)
  const [rangeSide, setRangeSide] = useState<"start" | "end">("start")

  const today = useMemo(() => new Date(), [])
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()

  const yearOptions = useMemo(
    () => buildYearOptions(currentYear - 5, currentYear),
    [currentYear]
  )

  const resolved = useMemo(() => resolveInsightDateBounds(value), [value])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(value)
      setRangeSide("start")
    }
    setOpen(nextOpen)
  }

  const activeWheelDate =
    draft.mode === "range"
      ? rangeSide === "start"
        ? draft.rangeStart
        : draft.rangeEnd
      : draft.date

  const activeYear = Math.min(activeWheelDate.getFullYear(), currentYear)
  const activeMonth =
    activeYear === currentYear
      ? Math.min(activeWheelDate.getMonth(), currentMonth)
      : activeWheelDate.getMonth()
  const activeDay =
    activeYear === currentYear && activeMonth === currentMonth
      ? Math.min(activeWheelDate.getDate(), currentDay)
      : activeWheelDate.getDate()

  const monthOptions = useMemo(
    () => buildMonthOptions(activeYear === currentYear ? currentMonth : 11),
    [activeYear, currentYear, currentMonth]
  )

  const dayOptions = useMemo(
    () =>
      buildDayOptions(
        activeYear,
        activeMonth,
        activeYear === currentYear && activeMonth === currentMonth
          ? currentDay
          : undefined
      ),
    [activeYear, activeMonth, currentYear, currentMonth, currentDay]
  )

  const updateActiveDate = (
    nextYear: number,
    nextMonth: number,
    nextDay: number
  ) => {
    const nextDate = clampDateToToday(nextYear, nextMonth, nextDay, today)
    setDraft((prev) => {
      if (prev.mode === "range") {
        return rangeSide === "start"
          ? { ...prev, rangeStart: nextDate }
          : { ...prev, rangeEnd: nextDate }
      }
      return { ...prev, date: nextDate }
    })
  }

  const weeklyPreview = useMemo(() => {
    if (draft.mode !== "weekly") return null
    const start = startOfWeek(draft.date, { weekStartsOn: 1 })
    const rawEnd = endOfWeek(draft.date, { weekStartsOn: 1 })
    const end = rawEnd > today ? today : rawEnd
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
  }, [draft.date, draft.mode, today])

  const handleConfirm = () => {
    onChange(draft)
  }

  return (
    <PickerDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Filter by Date"
      description="Choose a day, week, month, custom range, or all time."
      onConfirm={handleConfirm}
      confirmLabel="Apply"
      successLabel="Applied!"
      trigger={
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 w-full justify-between rounded-2xl px-3.5 text-xs font-medium shadow-sm"
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-3.5 text-primary-foreground" />
            <span>{resolved.label}</span>
          </span>
          <ChevronDown className="size-3.5 text-primary-foreground/80" />
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <CustomTabs
          items={MODE_OPTIONS}
          value={draft.mode}
          onValueChange={(mode) => setDraft((prev) => ({ ...prev, mode }))}
        />

        <div
          key={draft.mode}
          className="flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        >
          {draft.mode === "range" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRangeSide("start")}
                className={cn(
                  "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors",
                  rangeSide === "start"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  From
                </span>
                <span className="text-xs font-semibold">
                  {format(draft.rangeStart, "MMM d, yyyy")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRangeSide("end")}
                className={cn(
                  "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors",
                  rangeSide === "end"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  To
                </span>
                <span className="text-xs font-semibold">
                  {format(draft.rangeEnd, "MMM d, yyyy")}
                </span>
              </button>
            </div>
          )}

          {weeklyPreview && (
            <div className="rounded-xl bg-muted/50 px-3 py-1.5 text-center text-xs text-muted-foreground">
              Week: <strong className="text-foreground">{weeklyPreview}</strong>
            </div>
          )}

          {draft.mode === "all" ? (
            <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              Showing all recorded moods, nudges, and quizzes.
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-2",
                draft.mode === "monthly" ? "grid-cols-2" : "grid-cols-3"
              )}
            >
              <WheelPicker
                options={monthOptions}
                value={String(activeMonth)}
                onChange={(nextMonth) =>
                  updateActiveDate(activeYear, Number(nextMonth), activeDay)
                }
              />
              {draft.mode !== "monthly" && (
                <WheelPicker
                  options={dayOptions}
                  value={String(activeDay)}
                  onChange={(nextDay) =>
                    updateActiveDate(activeYear, activeMonth, Number(nextDay))
                  }
                />
              )}
              <WheelPicker
                options={yearOptions}
                value={String(activeYear)}
                onChange={(nextYear) =>
                  updateActiveDate(Number(nextYear), activeMonth, activeDay)
                }
              />
            </div>
          )}
        </div>
      </div>
    </PickerDrawer>
  )
}

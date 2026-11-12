import { format, isSameDay, isToday } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { TimelineFilterType } from "@/types/timeline"

export type FilterType = TimelineFilterType

interface TimelineFilterSectionProps {
  typeFilter: FilterType
  setTypeFilter: (filter: FilterType) => void
  selectedDate: Date | undefined
  setSelectedDate: (date: Date | undefined) => void
  isCalendarOpen: boolean
  setIsCalendarOpen: (open: boolean) => void
  activeDays: Date[]
}

export function TimelineFilterSection({
  typeFilter,
  setTypeFilter,
  selectedDate,
  setSelectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
  activeDays,
}: TimelineFilterSectionProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (selectedDate && date && isSameDay(selectedDate, date)) {
      setSelectedDate(undefined)
    } else {
      setSelectedDate(date)
    }
    setIsCalendarOpen(false)
  }

  const getDateLabel = () => {
    if (!selectedDate) return "All Dates"
    if (isToday(selectedDate)) return "Today"
    return format(selectedDate, "MMM d")
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Controls: Type Filter Tabs + Date Popover */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(["all", "mood", "nudge", "quiz"] as const).map((tab) => (
            <Button
              key={tab}
              variant={typeFilter === tab ? "default" : "outline"}
              size="xs"
              onClick={() => setTypeFilter(tab)}
              className="capitalize rounded-full px-3 text-xs h-7"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Compact Date Picker Popover */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                variant={selectedDate ? "default" : "outline"}
                size="xs"
                className={cn(
                  "h-7 gap-1.5 px-2.5 rounded-full text-xs shrink-0 font-medium",
                  selectedDate && "bg-primary text-primary-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="size-3.5" />
            <span>{getDateLabel()}</span>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-auto p-1 rounded-2xl border border-border shadow-lg"
          >
            <div className="p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                modifiers={{
                  hasActivity: activeDays,
                }}
                modifiersClassNames={{
                  hasActivity:
                    "font-bold underline decoration-primary decoration-2 underline-offset-4",
                }}
                captionLayout="dropdown"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between border-t border-border/50 p-2 pt-1.5">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedDate(new Date())
                  setIsCalendarOpen(false)
                }}
                className={cn(
                  "h-6 text-[11px]",
                  selectedDate && isToday(selectedDate)
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Today
              </Button>
              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSelectedDate(undefined)
                    setIsCalendarOpen(false)
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Show all dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Date Filter Chip */}
      {selectedDate && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-1.5 text-xs text-primary">
          <span>
            {isToday(selectedDate) ? (
              <>
                Showing <strong>Today</strong> ({format(selectedDate, "MMMM d, yyyy")})
              </>
            ) : (
              <>
                Filtering by <strong>{format(selectedDate, "MMMM d, yyyy")}</strong>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(undefined)}
            className="rounded p-0.5 hover:bg-primary/20 text-xs font-medium flex items-center gap-1"
            title="Show all dates"
          >
            <span className="text-[11px]">Show all</span>
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}


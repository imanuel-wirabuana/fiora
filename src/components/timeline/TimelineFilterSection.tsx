import { format, isToday } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { CustomDatePicker } from "@/components/pickers"
import { Button } from "@/components/ui/button"
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
}

export function TimelineFilterSection({
  typeFilter,
  setTypeFilter,
  selectedDate,
  setSelectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
}: TimelineFilterSectionProps) {
  const getDateLabel = () => {
    if (!selectedDate) return "All Dates"
    if (isToday(selectedDate)) return "Today"
    return format(selectedDate, "MMM d")
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {(["all", "mood", "nudge", "quiz"] as const).map((tab) => (
          <Button
            key={tab}
            variant={typeFilter === tab ? "default" : "outline"}
            size="xs"
            onClick={() => setTypeFilter(tab)}
            className="capitalize rounded-full px-3 text-[11px] h-7"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Compact Date Picker Drawer + Clear */}
      <div className="flex shrink-0 items-center gap-1">
        <CustomDatePicker
          variant="default"
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={new Date()}
          open={isCalendarOpen}
          onOpenChange={setIsCalendarOpen}
          title="Filter by Date"
          showTodayButton
          trigger={
            <Button
              type="button"
              variant={selectedDate ? "default" : "outline"}
              size="xs"
              className={cn(
                "h-7 gap-1.5 px-2.5 rounded-full text-[11px] shrink-0 font-medium",
                selectedDate && "bg-primary text-primary-foreground"
              )}
            >
              <CalendarIcon className="size-3.5" />
              <span>{getDateLabel()}</span>
            </Button>
          }
        />

        {selectedDate && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setSelectedDate(undefined)}
            aria-label="Show all dates"
            title="Show all dates"
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}


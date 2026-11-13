import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { SettingRow } from "./SettingRow"

export function AnniversarySection() {
  const {
    relationship,
    anniversary,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  const [open, setOpen] = useState(false)

  if (!hasRelationship || !relationship) {
    return null
  }

  const selectedDate = anniversary ? parseISO(anniversary) : undefined

  const daysTogether = selectedDate
    ? Math.max(0, differenceInCalendarDays(new Date(), selectedDate))
    : null

  const handleDateChange = (date: Date | undefined) => {
    setOpen(false)
    const formatted = date ? format(date, "yyyy-MM-dd") : null
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { anniversary: formatted },
    })
  }

  const handleClear = () => {
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { anniversary: null },
    })
  }

  return (
    <SettingRow
      icon={<CalendarIcon className="size-3.5" />}
      title="Anniversary"
      action={
        daysTogether !== null ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {daysTogether === 0
              ? "Today is Day 1!"
              : `${daysTogether} days together`}
          </span>
        ) : null
      }
    >
      <div className="flex w-full items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex h-8 flex-1 items-center justify-start gap-2 rounded-xl border border-input bg-background px-2.5 text-left text-xs text-foreground transition-colors outline-none hover:bg-muted/40 focus:border-primary",
                  !anniversary && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedDate
                ? format(selectedDate, "MMM d, yyyy")
                : "Set anniversary date"}
            </span>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto rounded-2xl border border-border p-0 shadow-lg"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              disabled={(date) => date > new Date()}
              captionLayout="dropdown"
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {anniversary && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            title="Remove anniversary date"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </SettingRow>
  )
}

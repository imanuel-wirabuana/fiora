import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Item,
  ItemContent,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

export function AnniversarySection() {
  const {
    relationship,
    anniversary,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  if (!hasRelationship || !relationship) {
    return null
  }

  const isPending = updateRelationshipContentMutation.isPending
  const selectedDate = anniversary ? parseISO(anniversary) : undefined

  // Calculate days together if anniversary exists
  const daysTogether = selectedDate
    ? Math.max(0, differenceInCalendarDays(new Date(), selectedDate))
    : null

  const handleDateChange = (date: Date | undefined) => {
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
    <Item variant="outline" className="w-full flex-col items-start gap-2.5 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <ItemTitle className="text-sm font-semibold">Anniversary</ItemTitle>
        {daysTogether !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {daysTogether === 0 ? "Today is Day 1!" : `${daysTogether} days together`}
          </span>
        )}
      </ItemHeader>

      <ItemContent className="w-full space-y-2">
        <div className="flex items-center gap-2 w-full">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  disabled={isPending}
                  className={cn(
                    "flex h-8 flex-1 items-center justify-start gap-2 rounded-xl border border-input bg-background px-2.5 text-left text-xs transition-colors hover:bg-muted/40 outline-none focus:border-primary",
                    !anniversary && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
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
              disabled={isPending}
              title="Remove anniversary date"
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </ItemContent>
    </Item>
  )
}


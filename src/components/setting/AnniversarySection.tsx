import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { CustomDatePicker } from "@/components/pickers"
import { Button } from "@/components/ui/button"
import { useRelationship } from "@/hooks/useRelationship"
import { SettingRow } from "./SettingRow"

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

  const selectedDate = anniversary ? parseISO(anniversary) : undefined

  const daysTogether = selectedDate
    ? Math.max(0, differenceInCalendarDays(new Date(), selectedDate))
    : null

  const handleDateChange = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd")
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { anniversary: formatted },
    })
  }

  const description =
    daysTogether === null
      ? "Set when your story began."
      : daysTogether === 0
        ? "Today is Day 1!"
        : `${daysTogether} days together`

  return (
    <SettingRow
      icon={<CalendarIcon className="size-3.5" />}
      title="Anniversary"
      description={description}
      action={
        <CustomDatePicker
          variant="default"
          value={selectedDate}
          onChange={handleDateChange}
          maxDate={new Date()}
          title="Anniversary Date"
          description="When did your story begin?"
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 rounded-xl px-2.5 text-xs font-medium"
            >
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Set date"}
            </Button>
          }
        />
      }
    />
  )
}

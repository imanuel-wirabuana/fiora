import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CustomDatePicker } from "@/components/pickers"
import { Button } from "@/components/ui/button"
import { useRelationship } from "@/hooks/useRelationship"
import { getDateFnsLocale } from "@/lib/i18n"
import { SettingRow } from "./SettingRow"

export function AnniversarySection() {
  const { t, i18n } = useTranslation("setting")
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
      ? t("anniversary.setStory")
      : daysTogether === 0
        ? t("anniversary.dayOne")
        : t("anniversary.daysTogether", { count: daysTogether })

  return (
    <SettingRow
      icon={<CalendarIcon className="size-3.5" />}
      title={t("anniversary.title")}
      description={description}
      action={
        <CustomDatePicker
          variant="default"
          value={selectedDate}
          onChange={handleDateChange}
          maxDate={new Date()}
          title={t("anniversary.drawerTitle")}
          description={t("anniversary.drawerDescription")}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 rounded-xl px-2.5 text-xs font-medium"
            >
              {selectedDate
                ? format(selectedDate, "MMM d, yyyy", {
                    locale: getDateFnsLocale(i18n.language),
                  })
                : t("anniversary.setDate")}
            </Button>
          }
        />
      }
    />
  )
}

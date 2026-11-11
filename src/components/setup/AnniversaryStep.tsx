import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface AnniversaryStepProps {
  anniversary: string | null
  onChangeAnniversary: (date: string | null) => void
}

export function AnniversaryStep({
  anniversary,
  onChangeAnniversary,
}: AnniversaryStepProps) {
  const selectedDate = anniversary ? parseISO(anniversary) : undefined

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Anniversary Date (Optional)
          </h3>
          <p className="text-xs text-muted-foreground">
            When did your story begin? You can change this anytime later.
          </p>
        </div>
        {anniversary && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChangeAnniversary(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <Field className="gap-1.5">
          <FieldLabel className="text-xs font-medium text-muted-foreground">
            Special Date
          </FieldLabel>

          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    "flex h-11 w-full items-center justify-start gap-2.5 rounded-2xl border border-input bg-background px-3.5 text-left text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                    !anniversary && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground/80" />
              <span className="truncate">
                {selectedDate
                  ? format(selectedDate, "PPP")
                  : "Pick an anniversary date"}
              </span>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto rounded-3xl border border-border p-0 shadow-2xl"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onChangeAnniversary(format(date, "yyyy-MM-dd"))
                  } else {
                    onChangeAnniversary(null)
                  }
                }}
                disabled={(date) => date > new Date()}
                captionLayout="dropdown"
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </Field>
      </div>
    </div>
  )
}

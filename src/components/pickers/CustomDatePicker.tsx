import * as React from "react"
import { format, getDaysInMonth } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PickerDrawer } from "./PickerDrawer"
import { WheelPicker, type WheelOption } from "./WheelPicker"

export type CustomDatePickerVariant =
  | "default"
  | "month-year"
  | "year"
  | "month"

export interface CustomDatePickerProps {
  variant?: CustomDatePickerVariant
  value?: Date
  onChange?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  monthFormat?: "short" | "long"
  placeholder?: string
  title?: string
  description?: string
  confirmLabel?: string
  successLabel?: string
  disabled?: boolean
  className?: string
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function clampDate(
  year: number,
  month: number,
  day: number,
  minDate: Date,
  maxDate: Date,
  variant: CustomDatePickerVariant
): Date {
  const minY = minDate.getFullYear()
  const maxY = maxDate.getFullYear()
  const clampedYear = Math.min(Math.max(year, minY), maxY)

  let clampedMonth = Math.min(Math.max(month, 0), 11)
  if (variant !== "month") {
    if (clampedYear === minY) {
      clampedMonth = Math.max(clampedMonth, minDate.getMonth())
    }
    if (clampedYear === maxY) {
      clampedMonth = Math.min(clampedMonth, maxDate.getMonth())
    }
  }

  if (variant === "year") {
    return new Date(clampedYear, 0, 1)
  }

  if (variant === "month-year" || variant === "month") {
    return new Date(clampedYear, clampedMonth, 1)
  }

  const maxDaysInMonth = getDaysInMonth(new Date(clampedYear, clampedMonth, 1))
  let clampedDay = Math.min(Math.max(day, 1), maxDaysInMonth)

  if (clampedYear === minY && clampedMonth === minDate.getMonth()) {
    clampedDay = Math.max(clampedDay, minDate.getDate())
  }
  if (clampedYear === maxY && clampedMonth === maxDate.getMonth()) {
    clampedDay = Math.min(clampedDay, maxDate.getDate())
  }

  return new Date(clampedYear, clampedMonth, clampedDay)
}

function formatTriggerValue(
  date: Date,
  variant: CustomDatePickerVariant
): string {
  switch (variant) {
    case "month-year":
      return format(date, "MMM yyyy")
    case "year":
      return format(date, "yyyy")
    case "month":
      return format(date, "MMMM")
    case "default":
    default:
      return format(date, "MMM d, yyyy")
  }
}

export function CustomDatePicker({
  variant = "default",
  value,
  onChange,
  minDate: minDateProp,
  maxDate: maxDateProp,
  monthFormat = "short",
  placeholder = "Select date",
  title = "Select Date",
  description,
  confirmLabel = "Done",
  successLabel = "Saved!",
  disabled = false,
  className,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CustomDatePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isOpen = controlledOpen ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange]
  )

  const minDate = React.useMemo(
    () => minDateProp ?? new Date(1950, 0, 1),
    [minDateProp]
  )
  const maxDate = React.useMemo(
    () => maxDateProp ?? new Date(new Date().getFullYear() + 10, 11, 31),
    [maxDateProp]
  )

  const getInitialDraft = React.useCallback(() => {
    const base = value ?? new Date()
    return clampDate(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      minDate,
      maxDate,
      variant
    )
  }, [value, minDate, maxDate, variant])

  const [draftDate, setDraftDate] = React.useState<Date>(getInitialDraft)

  const handleOpenChange = (next: boolean) => {
    if (disabled && next) return
    if (next) {
      setDraftDate(getInitialDraft())
    }
    setOpen(next)
  }

  const draftYear = draftDate.getFullYear()
  const draftMonth = draftDate.getMonth()
  const draftDay = draftDate.getDate()

  const yearOptions = React.useMemo<WheelOption<number>[]>(() => {
    const startYear = minDate.getFullYear()
    const endYear = maxDate.getFullYear()
    const list: WheelOption<number>[] = []
    for (let y = startYear; y <= endYear; y++) {
      list.push({ label: String(y), value: y })
    }
    return list
  }, [minDate, maxDate])

  const monthOptions = React.useMemo<WheelOption<number>[]>(() => {
    const pattern = monthFormat === "short" ? "MMM" : "MMMM"
    const minY = minDate.getFullYear()
    const maxY = maxDate.getFullYear()

    return Array.from({ length: 12 }, (_, m) => {
      let isDisabled = false
      if (variant !== "month") {
        if (draftYear === minY && m < minDate.getMonth()) isDisabled = true
        if (draftYear === maxY && m > maxDate.getMonth()) isDisabled = true
      }
      return {
        label: format(new Date(2000, m, 1), pattern),
        value: m,
        disabled: isDisabled,
      }
    })
  }, [monthFormat, minDate, maxDate, draftYear, variant])

  const dayOptions = React.useMemo<WheelOption<number>[]>(() => {
    const totalDays = getDaysInMonth(new Date(draftYear, draftMonth, 1))
    const minY = minDate.getFullYear()
    const maxY = maxDate.getFullYear()

    return Array.from({ length: totalDays }, (_, idx) => {
      const d = idx + 1
      let isDisabled = false
      if (
        draftYear === minY &&
        draftMonth === minDate.getMonth() &&
        d < minDate.getDate()
      ) {
        isDisabled = true
      }
      if (
        draftYear === maxY &&
        draftMonth === maxDate.getMonth() &&
        d > maxDate.getDate()
      ) {
        isDisabled = true
      }
      return {
        label: String(d),
        value: d,
        disabled: isDisabled,
      }
    })
  }, [draftYear, draftMonth, minDate, maxDate])

  const handleDayChange = React.useCallback(
    (newDay: number) => {
      setDraftDate((prev) =>
        clampDate(
          prev.getFullYear(),
          prev.getMonth(),
          newDay,
          minDate,
          maxDate,
          variant
        )
      )
    },
    [minDate, maxDate, variant]
  )

  const handleMonthChange = React.useCallback(
    (newMonth: number) => {
      setDraftDate((prev) =>
        clampDate(
          prev.getFullYear(),
          newMonth,
          prev.getDate(),
          minDate,
          maxDate,
          variant
        )
      )
    },
    [minDate, maxDate, variant]
  )

  const handleYearChange = React.useCallback(
    (newYear: number) => {
      setDraftDate((prev) =>
        clampDate(
          newYear,
          prev.getMonth(),
          prev.getDate(),
          minDate,
          maxDate,
          variant
        )
      )
    },
    [minDate, maxDate, variant]
  )

  const handleConfirm = () => {
    onChange?.(draftDate)
  }

  const defaultTrigger = (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex h-8 items-center justify-start gap-2 rounded-xl border border-input bg-background px-2.5 text-left text-xs text-foreground transition-colors outline-none hover:bg-muted/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        !value && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {value ? formatTriggerValue(value, variant) : placeholder}
      </span>
    </button>
  )

  return (
    <PickerDrawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      trigger={trigger ?? defaultTrigger}
      onConfirm={handleConfirm}
      confirmLabel={confirmLabel}
      successLabel={successLabel}
    >
      <div className="flex w-full items-center gap-1">
        {variant === "default" && (
          <WheelPicker
            options={dayOptions}
            value={draftDay}
            onChange={handleDayChange}
            ariaLabel="Day"
            className="flex-[0.8]"
          />
        )}

        {(variant === "default" ||
          variant === "month-year" ||
          variant === "month") && (
          <WheelPicker
            options={monthOptions}
            value={draftMonth}
            onChange={handleMonthChange}
            loop={variant === "month"}
            ariaLabel="Month"
            className="flex-[1.2]"
          />
        )}

        {(variant === "default" ||
          variant === "month-year" ||
          variant === "year") && (
          <WheelPicker
            options={yearOptions}
            value={draftYear}
            onChange={handleYearChange}
            ariaLabel="Year"
            className="flex-1"
          />
        )}
      </div>
    </PickerDrawer>
  )
}


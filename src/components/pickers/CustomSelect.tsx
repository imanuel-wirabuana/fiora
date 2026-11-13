import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { PickerDrawer } from "./PickerDrawer"
import { WheelPicker, type WheelOption } from "./WheelPicker"

export interface CustomSelectProps<T extends string | number = string> {
  value?: T
  onValueChange?: (value: T) => void
  options: readonly WheelOption<T>[]
  placeholder?: string
  title?: string
  description?: string
  confirmLabel?: string
  successLabel?: string
  loop?: boolean
  disabled?: boolean
  className?: string
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CustomSelect<T extends string | number = string>({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  title = "Select",
  description,
  confirmLabel = "Done",
  successLabel = "Saved!",
  loop = false,
  disabled = false,
  className,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CustomSelectProps<T>) {
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

  const fallbackValue = React.useMemo(() => {
    const enabled = options.find((opt) => !opt.disabled)
    return enabled?.value ?? options[0]?.value
  }, [options])

  const [draftValue, setDraftValue] = React.useState<T | undefined>(
    () => value ?? fallbackValue
  )

  const handleOpenChange = (next: boolean) => {
    if (disabled && next) return
    if (next) {
      setDraftValue(value ?? fallbackValue)
    }
    setOpen(next)
  }

  const handleConfirm = () => {
    if (draftValue !== undefined) {
      onValueChange?.(draftValue)
    }
  }

  const selectedOption = options.find((opt) => opt.value === value)

  const defaultTrigger = (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex h-8 items-center justify-between gap-2 rounded-xl border border-input bg-background px-2.5 text-left text-xs font-medium text-foreground transition-colors outline-none hover:bg-muted/40 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        !selectedOption && "text-muted-foreground",
        className
      )}
    >
      <span className="truncate">
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
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
      {options.length > 0 && draftValue !== undefined ? (
        <WheelPicker
          options={options}
          value={draftValue}
          onChange={setDraftValue}
          loop={loop}
          ariaLabel={title}
        />
      ) : null}
    </PickerDrawer>
  )
}


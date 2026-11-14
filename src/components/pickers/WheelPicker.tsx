import * as React from "react"
import {
  WheelPicker as PrimitiveWheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@/components/ui/wheel-picker"
import { cn } from "@/lib/utils"

export interface WheelOption<T extends string | number = string> {
  label: React.ReactNode
  value: T
  textValue?: string
  disabled?: boolean
}

export interface WheelPickerProps<T extends string | number = string> {
  options: readonly WheelOption<T>[]
  value: T
  onChange: (value: T) => void
  loop?: boolean
  optionItemHeight?: number
  visibleCount?: number
  className?: string
  itemClassName?: string
  highlightClassName?: string
  ariaLabel?: string
}

const DEFAULT_ITEM_HEIGHT = 44
const DEFAULT_VISIBLE_COUNT = 16

export function WheelPicker<T extends string | number = string>({
  options,
  value,
  onChange,
  loop = false,
  optionItemHeight = DEFAULT_ITEM_HEIGHT,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  className,
  itemClassName,
  highlightClassName,
  ariaLabel,
}: WheelPickerProps<T>) {
  const pickerOptions = React.useMemo<WheelPickerOption<T>[]>(
    () =>
      options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        textValue: opt.textValue,
        disabled: opt.disabled,
      })),
    [options]
  )

  return (
    <div
      className={cn(
        "relative flex-1 touch-none overscroll-contain overflow-hidden select-none",
        className
      )}
      aria-label={ariaLabel}
      // Prevent parent Drawer's vertical swipe-to-dismiss or background scroll from hijacking wheel drags
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <WheelPickerWrapper className="w-full">
        <PrimitiveWheelPicker
          options={pickerOptions}
          value={value}
          onValueChange={onChange}
          infinite={loop}
          visibleCount={visibleCount}
          optionItemHeight={optionItemHeight}
          classNames={{
            optionItem: cn(
              "px-3 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground/80 data-disabled:cursor-not-allowed data-disabled:opacity-30",
              itemClassName
            ),
            highlightWrapper: cn(
              "inset-x-1 w-auto! rounded-xl border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_10%,var(--popover))]",
              highlightClassName
            ),
            highlightItem: cn(
              "scale-105 px-3 text-sm font-semibold text-primary data-disabled:cursor-not-allowed data-disabled:opacity-30",
              itemClassName
            ),
          }}
        />
      </WheelPickerWrapper>
    </div>
  )
}

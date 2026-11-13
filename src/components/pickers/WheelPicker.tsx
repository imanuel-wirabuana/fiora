import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export interface WheelOption<T extends string | number = string> {
  label: string
  value: T
  disabled?: boolean
}

export interface WheelPickerProps<T extends string | number = string> {
  options: readonly WheelOption<T>[]
  value: T
  onChange: (value: T) => void
  loop?: boolean
  className?: string
  itemClassName?: string
  ariaLabel?: string
}

const ITEM_HEIGHT = 44

export function WheelPicker<T extends string | number = string>({
  options,
  value,
  onChange,
  loop = false,
  className,
  itemClassName,
  ariaLabel,
}: WheelPickerProps<T>) {
  const [api, setApi] = React.useState<CarouselApi>()
  const isInternalScrollRef = React.useRef(false)
  const hasInitializedRef = React.useRef(false)

  const selectedIndex = React.useMemo(() => {
    const idx = options.findIndex((opt) => opt.value === value)
    return idx >= 0 ? idx : 0
  }, [options, value])

  const findNearestEnabledIndex = React.useCallback(
    (targetIndex: number) => {
      if (!options[targetIndex]?.disabled) return targetIndex
      for (let offset = 1; offset < options.length; offset++) {
        const forward = targetIndex + offset
        if (forward < options.length && !options[forward]?.disabled) {
          return forward
        }
        const backward = targetIndex - offset
        if (backward >= 0 && !options[backward]?.disabled) {
          return backward
        }
      }
      return targetIndex
    },
    [options]
  )

  // Sync Embla position when value or options change externally
  React.useEffect(() => {
    if (!api || options.length === 0) return

    const currentSnap = api.selectedScrollSnap()
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      api.scrollTo(selectedIndex, true)
      return
    }

    if (currentSnap !== selectedIndex && !isInternalScrollRef.current) {
      api.scrollTo(selectedIndex, false)
    }
    isInternalScrollRef.current = false
  }, [api, selectedIndex, options.length])

  // Re-initialize Embla when options count changes (e.g. days in month)
  React.useEffect(() => {
    if (!api) return
    api.reInit()
    api.scrollTo(selectedIndex, true)
  }, [api, options.length, selectedIndex])

  // Listen to Embla select events
  React.useEffect(() => {
    if (!api) return

    const handleSelect = () => {
      const snapIndex = api.selectedScrollSnap()
      const validIndex = findNearestEnabledIndex(snapIndex)

      if (validIndex !== snapIndex) {
        api.scrollTo(validIndex, false)
        return
      }

      const option = options[validIndex]
      if (option && option.value !== value && !option.disabled) {
        isInternalScrollRef.current = true
        onChange(option.value)
      }
    }

    api.on("select", handleSelect)
    return () => {
      api.off("select", handleSelect)
    }
  }, [api, options, value, onChange, findNearestEnabledIndex])

  const handleItemClick = (index: number, option: WheelOption<T>) => {
    if (option.disabled) return
    api?.scrollTo(index)
    if (option.value !== value) {
      isInternalScrollRef.current = true
      onChange(option.value)
    }
  }

  return (
    <div
      className={cn(
        "relative flex-1 overflow-hidden select-none touch-pan-y",
        className
      )}
      style={{ height: ITEM_HEIGHT * 5 }}
      aria-label={ariaLabel}
      // Prevent parent Drawer's vertical swipe-to-dismiss from hijacking wheel drags
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Center selection highlight band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-1/2 z-0 -translate-y-1/2 rounded-xl border border-primary/40 bg-primary/10"
        style={{ height: ITEM_HEIGHT }}
      />

      {/* Top fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-popover via-popover/75 to-transparent"
      />

      {/* Bottom fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-popover via-popover/75 to-transparent"
      />

      <Carousel
        orientation="vertical"
        setApi={setApi}
        opts={{
          align: "center",
          containScroll: false,
          dragFree: false,
          loop,
          startIndex: selectedIndex,
        }}
        className="relative z-10 h-full w-full [&_[data-slot=carousel-content]]:h-full"
      >
        <CarouselContent className="mt-0 h-full">
          {options.map((option, index) => {
            const isSelected = index === selectedIndex
            return (
              <CarouselItem
                key={String(option.value)}
                className="basis-auto pt-0"
                style={{ height: ITEM_HEIGHT }}
              >
                <button
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleItemClick(index, option)}
                  className={cn(
                    "relative z-10 flex h-full w-full items-center justify-center px-3 text-sm transition-all duration-150 outline-none",
                    isSelected
                      ? "scale-105 font-semibold text-primary"
                      : "font-normal text-muted-foreground hover:text-foreground/80",
                    option.disabled && "cursor-not-allowed opacity-30",
                    itemClassName
                  )}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}


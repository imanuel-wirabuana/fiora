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
  dragFree?: boolean
  itemHeight?: number
  visibleCount?: number
  renderOption?: (
    option: WheelOption<T>,
    state: { isSelected: boolean }
  ) => React.ReactNode
  className?: string
  itemClassName?: string
  ariaLabel?: string
}

const DEFAULT_ITEM_HEIGHT = 44
const DEFAULT_VISIBLE_COUNT = 5
const WHEEL_STEP_THRESHOLD = 24

function getClosestCenterIndex(api: NonNullable<CarouselApi>): number {
  const rootRect = api.rootNode().getBoundingClientRect()
  const centerY = rootRect.top + rootRect.height / 2
  const slides = api.slideNodes()

  let closestIdx = 0
  let minDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < slides.length; i++) {
    const rect = slides[i].getBoundingClientRect()
    const slideCenterY = rect.top + rect.height / 2
    const distance = Math.abs(slideCenterY - centerY)
    if (distance < minDistance) {
      minDistance = distance
      closestIdx = i
    }
  }

  return closestIdx
}

export function WheelPicker<T extends string | number = string>({
  options,
  value,
  onChange,
  loop = false,
  dragFree = true,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  renderOption,
  className,
  itemClassName,
  ariaLabel,
}: WheelPickerProps<T>) {
  const [api, setApi] = React.useState<CarouselApi>()
  const lastEmittedValueRef = React.useRef<T>(value)
  const hasInitializedRef = React.useRef(false)
  const wheelDeltaRef = React.useRef(0)

  const selectedIndex = React.useMemo(() => {
    const idx = options.findIndex((opt) => opt.value === value)
    return idx >= 0 ? idx : 0
  }, [options, value])

  const selectedIndexRef = React.useRef(selectedIndex)
  React.useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  const [liveIndex, setLiveIndex] = React.useState(selectedIndex)
  const [prevSelectedIndex, setPrevSelectedIndex] =
    React.useState(selectedIndex)

  if (selectedIndex !== prevSelectedIndex) {
    setPrevSelectedIndex(selectedIndex)
    setLiveIndex(selectedIndex)
  }

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

  // Sync Embla position only when value changes externally (never interrupt coasting)
  React.useEffect(() => {
    if (!api || options.length === 0) return

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      lastEmittedValueRef.current = value
      api.scrollTo(selectedIndex, true)
      return
    }

    if (value === lastEmittedValueRef.current) {
      return
    }

    lastEmittedValueRef.current = value
    api.scrollTo(selectedIndex, false)
  }, [api, selectedIndex, value, options.length])

  // Re-initialize Embla only when options count changes (e.g. days in month)
  React.useEffect(() => {
    if (!api || !hasInitializedRef.current) return
    api.reInit()
    api.scrollTo(selectedIndexRef.current, true)
  }, [api, options.length])

  // Track live center item during drag/coast & snap cleanly only on settle
  React.useEffect(() => {
    if (!api) return

    const handleScroll = () => {
      const closestIndex = getClosestCenterIndex(api)
      setLiveIndex((prev) => (prev === closestIndex ? prev : closestIndex))

      const option = options[closestIndex]
      if (
        option &&
        !option.disabled &&
        option.value !== lastEmittedValueRef.current
      ) {
        lastEmittedValueRef.current = option.value
        onChange(option.value)
      }
    }

    const handleSettle = () => {
      const closestIndex = getClosestCenterIndex(api)
      const validIndex = findNearestEnabledIndex(closestIndex)

      if (validIndex !== closestIndex) {
        api.scrollTo(validIndex, false)
        return
      }

      setLiveIndex(validIndex)
      const option = options[validIndex]
      if (
        option &&
        !option.disabled &&
        option.value !== lastEmittedValueRef.current
      ) {
        lastEmittedValueRef.current = option.value
        onChange(option.value)
      }
    }

    api.on("scroll", handleScroll)
    api.on("settle", handleSettle)
    return () => {
      api.off("scroll", handleScroll)
      api.off("settle", handleSettle)
    }
  }, [api, options, onChange, findNearestEnabledIndex])

  const handleItemClick = (index: number, option: WheelOption<T>) => {
    if (option.disabled) return
    lastEmittedValueRef.current = option.value
    setLiveIndex(index)
    api?.scrollTo(index)
    if (option.value !== value) {
      onChange(option.value)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!api) return
    wheelDeltaRef.current += e.deltaY
    if (Math.abs(wheelDeltaRef.current) < WHEEL_STEP_THRESHOLD) return

    if (wheelDeltaRef.current > 0) {
      api.scrollNext()
    } else {
      api.scrollPrev()
    }
    wheelDeltaRef.current = 0
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!api) return
    if (e.key === "ArrowUp") {
      e.preventDefault()
      api.scrollPrev()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      api.scrollNext()
    }
  }

  const containerHeight = itemHeight * visibleCount
  const fadeHeight = Math.max(itemHeight, (containerHeight - itemHeight) / 2)

  return (
    <div
      tabIndex={0}
      role="listbox"
      aria-label={ariaLabel}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      // Prevent parent Drawer's vertical swipe-to-dismiss from hijacking wheel drags
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={cn(
        "relative flex-1 overflow-hidden outline-none select-none touch-pan-y",
        className
      )}
      style={{ height: containerHeight }}
    >
      {/* Center selection highlight band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-1/2 z-0 -translate-y-1/2 rounded-xl border border-primary/40 bg-primary/10"
        style={{ height: itemHeight }}
      />

      {/* Top fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-popover via-popover/75 to-transparent"
        style={{ height: fadeHeight }}
      />

      {/* Bottom fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-popover via-popover/75 to-transparent"
        style={{ height: fadeHeight }}
      />

      <Carousel
        orientation="vertical"
        setApi={setApi}
        opts={{
          align: "center",
          containScroll: false,
          dragFree,
          duration: 20,
          loop,
          startIndex: selectedIndex,
        }}
        className="relative z-10 h-full w-full [&_[data-slot=carousel-content]]:h-full"
      >
        <CarouselContent className="mt-0 h-full">
          {options.map((option, index) => {
            const isSelected = index === liveIndex
            return (
              <CarouselItem
                key={String(option.value)}
                className="basis-auto pt-0"
                style={{ height: itemHeight }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
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
                  {renderOption ? (
                    renderOption(option, { isSelected })
                  ) : (
                    <span className="truncate">{option.label}</span>
                  )}
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

import { useState, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface CustomTabItem<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  badge?: number | string
  disabled?: boolean
}

interface CustomTabsProps<T extends string = string> {
  items: CustomTabItem<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  className?: string
}

/**
 * Mobile-first segmented tabs with a smooth sliding primary pill indicator.
 */
export function CustomTabs<T extends string = string>({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
}: CustomTabsProps<T>) {
  const [internalValue, setInternalValue] = useState<T>(
    () => defaultValue ?? items[0]?.value
  )
  const activeValue = value ?? internalValue
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === activeValue)
  )

  const selectTab = (nextValue: T) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (items.length <= 1) return
    let nextIdx: number | null = null
    if (e.key === "ArrowRight") {
      nextIdx = (idx + 1) % items.length
    } else if (e.key === "ArrowLeft") {
      nextIdx = (idx - 1 + items.length) % items.length
    }
    if (nextIdx !== null) {
      e.preventDefault()
      const nextItem = items[nextIdx]
      if (nextItem && !nextItem.disabled) {
        selectTab(nextItem.value)
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "relative grid w-full rounded-2xl border border-border/60 bg-muted/60 p-1 shadow-2xs",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))`,
      }}
    >
      {/* Sliding primary pill indicator */}
      {items.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl bg-primary shadow-sm transition-transform duration-200 ease-out"
          style={{
            width: `calc((100% - 0.5rem) / ${items.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      )}

      {items.map((item, idx) => {
        const isActive = item.value === activeValue
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => selectTab(item.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  "inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] leading-tight font-semibold transition-colors",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/80 text-muted-foreground"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}


import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface OdometerTextProps {
  items: string[]
  intervalMs?: number
  className?: string
}

interface OdometerReelProps {
  items: string[]
  intervalMs: number
  className?: string
}

const ROW_HEIGHT_EM = 1.35

function OdometerReel({ items, intervalMs, className }: OdometerReelProps) {
  const [index, setIndex] = useState(0)
  const [instant, setInstant] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setInstant(false)
      setIndex((prev) => (prev >= items.length ? items.length : prev + 1))
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [items.length, intervalMs])

  const handleTransitionEnd = () => {
    if (index === items.length) {
      setInstant(true)
      setIndex(0)
    }
  }

  const reelItems = [...items, items[0]]

  return (
    <span
      className={cn(
        "relative inline-flex w-full min-w-0 flex-col overflow-hidden text-left align-bottom",
        className
      )}
      style={{ height: `${ROW_HEIGHT_EM}em` }}
      aria-label={items[0]}
    >
      <span
        onTransitionEnd={handleTransitionEnd}
        className={cn(
          "flex w-full min-w-0 flex-col will-change-transform",
          instant
            ? "transition-none"
            : "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        )}
        style={{
          transform: `translateY(-${index * ROW_HEIGHT_EM}em)`,
        }}
      >
        {reelItems.map((label, idx) => (
          <span
            key={`${idx}-${label}`}
            aria-hidden={idx !== 0}
            className="block w-full truncate text-left"
            style={{
              height: `${ROW_HEIGHT_EM}em`,
              lineHeight: `${ROW_HEIGHT_EM}em`,
            }}
          >
            {label}
          </span>
        ))}
      </span>
    </span>
  )
}

export function OdometerText({
  items,
  intervalMs = 3200,
  className,
}: OdometerTextProps) {
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const raw of items) {
      const trimmed = raw.trim()
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed)
        result.push(trimmed)
      }
    }
    return result
  }, [items])

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (uniqueItems.length <= 1 || prefersReducedMotion) {
    return (
      <span className={cn("block truncate text-left", className)}>
        {uniqueItems[0] ?? ""}
      </span>
    )
  }

  return (
    <OdometerReel
      key={uniqueItems.join("\0")}
      items={uniqueItems}
      intervalMs={intervalMs}
      className={className}
    />
  )
}


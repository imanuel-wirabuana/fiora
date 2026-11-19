import { useTranslation } from "react-i18next"
import { Progress } from "@/components/ui/progress"
import { PET_STAT_LIST, PET_STAT_THRESHOLDS } from "@/lib/petConfig"
import { formatStatValue } from "@/lib/petLogic"
import { cn } from "@/lib/utils"
import type { PetStats } from "@/types/pet"

interface PetStatsPanelProps {
  stats: PetStats
  embedded?: boolean
  className?: string
}

export function PetStatsPanel({
  stats,
  embedded = false,
  className,
}: PetStatsPanelProps) {
  const { t } = useTranslation("space")

  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2",
        embedded
          ? "border-t border-border/40 pt-1.5"
          : "rounded-2xl border border-border/60 bg-card/85 px-3 py-2 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {PET_STAT_LIST.map(({ key, emoji, barClass }) => {
        const value = formatStatValue(stats[key])
        const isLow = value < PET_STAT_THRESHOLDS.lowWarning
        const isOverlimit = value > 100
        const label = t(`pet.stats.${key}`)

        return (
          <div
            key={key}
            title={`${label}: ${value}%`}
            aria-label={`${label}: ${value}%`}
            className="min-w-0 space-y-1"
          >
            <div className="flex items-center justify-between gap-0.5 text-[10px] leading-none">
              <span className="text-xs leading-none">{emoji}</span>
              <span
                className={cn(
                  "truncate font-semibold tabular-nums",
                  isLow
                    ? "text-destructive"
                    : isOverlimit
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                )}
              >
                {value}%
              </span>
            </div>
            <Progress
              value={Math.min(100, value)}
              className={cn(
                "[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-foreground/10 dark:[&_[data-slot=progress-track]]:bg-white/10 [&_[data-slot=progress-indicator]]:rounded-full",
                barClass
              )}
            />
          </div>
        )
      })}
    </div>
  )
}

import { useTranslation } from "react-i18next"
import { Progress } from "@/components/ui/progress"
import { PET_STAT_LIST, PET_STAT_THRESHOLDS } from "@/lib/petConfig"
import { formatStatValue } from "@/lib/petLogic"
import { cn } from "@/lib/utils"
import type { PetStats } from "@/types/pet"

interface PetStatsPanelProps {
  stats: PetStats
  className?: string
}

export function PetStatsPanel({ stats, className }: PetStatsPanelProps) {
  const { t } = useTranslation("space")

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-2xl border border-border/60 bg-card/85 px-3 py-2 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {PET_STAT_LIST.map(({ key, emoji, barClass }) => {
        const value = formatStatValue(stats[key])
        const isLow = value < PET_STAT_THRESHOLDS.lowWarning
        const isOverlimit = value > 100

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between gap-1 text-[11px] leading-tight">
              <span className="flex min-w-0 items-center gap-1 font-medium text-foreground">
                <span className="text-xs leading-none">{emoji}</span>
                <span className="truncate">{t(`pet.stats.${key}`)}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 font-semibold tabular-nums",
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

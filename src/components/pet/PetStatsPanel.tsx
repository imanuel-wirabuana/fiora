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
        "grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-card/80 p-3.5 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {PET_STAT_LIST.map(({ key, emoji, barClass }) => {
        const value = formatStatValue(stats[key])
        const isLow = value < PET_STAT_THRESHOLDS.lowWarning

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <span>{emoji}</span>
                <span>{t(`pet.stats.${key}`)}</span>
              </span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  isLow ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {value}%
              </span>
            </div>
            <Progress value={value} className={cn("h-2 bg-muted/70", barClass)} />
          </div>
        )
      })}
    </div>
  )
}

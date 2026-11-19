import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { PET_ACTIVITY_LIST } from "@/lib/petConfig"
import { cn } from "@/lib/utils"
import type { PetActivityType } from "@/types/pet"

interface PetActivityBarProps {
  activeType: PetActivityType | null
  isSleeping: boolean
  canPlay?: boolean
  onSelect: (type: PetActivityType) => void
  onStartBathDrag?: (x: number, y: number) => void
  className?: string
}

export function PetActivityBar({
  activeType,
  isSleeping,
  canPlay = true,
  onSelect,
  onStartBathDrag,
  className,
}: PetActivityBarProps) {
  const { t } = useTranslation("space")

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {PET_ACTIVITY_LIST.map(({ type, icon, tint }) => {
        const isCurrent = activeType === type
        const isPlayTired = type === "play" && !canPlay
        const isDisabled = (isSleeping && type !== "sleep") || isPlayTired
        const label =
          type === "sleep" && isSleeping
            ? t("pet.interactive.wakeUp")
            : t(`pet.activities.${type}`)

        return (
          <Button
            key={type}
            type="button"
            variant="ghost"
            size="icon"
            disabled={isDisabled}
            aria-label={label}
            title={label}
            onPointerDown={(e) => {
              if (type === "bath" && !isDisabled && onStartBathDrag) {
                e.preventDefault()
                onStartBathDrag(e.clientX, e.clientY)
              }
            }}
            onClick={() => {
              if (type !== "bath") onSelect(type)
            }}
            className={cn(
              "relative size-12 touch-none rounded-full border border-border/50 shadow-sm backdrop-blur-md transition-transform active:scale-95",
              tint,
              isCurrent && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <span className="text-xl leading-none">{icon}</span>
          </Button>
        )
      })}
    </div>
  )
}

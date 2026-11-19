import { PencilRuler, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { PET_COSMETIC_SLOTS } from "@/lib/petConfig"
import { getCosmeticItem } from "@/lib/petLogic"
import { getRoomTheme } from "@/lib/petRooms"
import { cn } from "@/lib/utils"
import type { PetCosmeticSlot, PetCosmetics } from "@/types/pet"

interface PetCosmeticBarProps {
  cosmetics: PetCosmetics
  activeSlot: PetCosmeticSlot | null
  onSelect: (slot: PetCosmeticSlot) => void
  onEnterEditMode?: () => void
  className?: string
}

export function PetCosmeticBar({
  cosmetics,
  activeSlot,
  onSelect,
  onEnterEditMode,
  className,
}: PetCosmeticBarProps) {
  const { t } = useTranslation("space")
  const hasWearables = Boolean(
    cosmetics.headwear ||
      cosmetics.facewear ||
      cosmetics.clothes ||
      cosmetics.footwear
  )

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {PET_COSMETIC_SLOTS.map(({ slot, tint }) => {
        const equippedEmoji =
          slot === "room"
            ? (getRoomTheme(cosmetics.room)?.signatureEmoji ?? null)
            : (getCosmeticItem(slot, cosmetics[slot])?.emoji ?? null)
        const isCurrent = activeSlot === slot
        const label = t(`pet.cosmetics.slots.${slot}`)

        return (
          <Button
            key={slot}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            onClick={() => onSelect(slot)}
            className={cn(
              "size-12 rounded-full border border-border/50 shadow-sm backdrop-blur-md transition-transform active:scale-95",
              tint,
              isCurrent && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {equippedEmoji ? (
              <span className="text-xl leading-none">{equippedEmoji}</span>
            ) : (
              <Plus className="size-5 opacity-75" />
            )}
          </Button>
        )
      })}

      {hasWearables && onEnterEditMode && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={t("pet.cosmetics.editMode")}
          title={t("pet.cosmetics.editMode")}
          onClick={onEnterEditMode}
          className="mt-1 size-12 rounded-full border border-border/60 bg-card/85 shadow-sm backdrop-blur-md transition-transform active:scale-95"
        >
          <PencilRuler className="size-5 text-primary" />
        </Button>
      )}
    </div>
  )
}

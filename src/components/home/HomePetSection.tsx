import { Link } from "wouter"
import { PetCharacter } from "@/components/pet"
import { usePet } from "@/hooks/usePet"
import { PET_STAT_THRESHOLDS } from "@/lib/petConfig"
import {
  getCosmeticItem,
  getCosmeticTransform,
  resolvePetExpression,
} from "@/lib/petLogic"
import type { PetWearableSlot } from "@/types/pet"

export function HomePetSection() {
  const { pet, content } = usePet()

  if (!pet) return null

  const expression = resolvePetExpression(content)
  const headwearItem = getCosmeticItem("headwear", content.cosmetics?.headwear)
  const facewearItem = getCosmeticItem("facewear", content.cosmetics?.facewear)
  const clothesItem = getCosmeticItem("clothes", content.cosmetics?.clothes)

  const resolveWearable = (slot: PetWearableSlot, emoji?: string | null) => {
    if (!emoji) return null
    return {
      emoji,
      transform: getCosmeticTransform(content, slot),
    }
  }

  const { hunger, happiness, energy, hygiene } = content.stats
  const minStat = Math.min(hunger, happiness, energy, hygiene)
  const isNeedsCare = minStat < PET_STAT_THRESHOLDS.lowWarning

  return (
    <Link
      href="/space/virtual-pets"
      className="flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 bg-transparent px-2 py-1 text-center text-primary-foreground transition-transform active:scale-95"
    >
      <div className="pointer-events-none relative flex size-11 shrink-0 items-center justify-center">
        <PetCharacter
          avatarSeed={pet.unique_name}
          size={42}
          expression={expression}
          isSleeping={Boolean(content.isSleeping)}
          interactive={false}
          wearables={{
            headwear: resolveWearable("headwear", headwearItem?.emoji),
            facewear: resolveWearable("facewear", facewearItem?.emoji),
            clothes: resolveWearable("clothes", clothesItem?.emoji),
          }}
        />
        {(content.isSleeping || isNeedsCare) && (
          <span className="pointer-events-none absolute -top-1 -right-1 text-[11px] leading-none">
            {content.isSleeping ? "💤" : "❗"}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col items-center leading-tight">
        <span className="max-w-20 truncate text-xs font-semibold">
          {pet.name}
        </span>
        <span className="text-[10px] font-medium text-primary-foreground/80">
          Lv. {content.level}
        </span>
      </div>
    </Link>
  )
}

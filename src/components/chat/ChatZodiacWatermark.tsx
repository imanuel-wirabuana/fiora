import { useMemo } from "react"
import type { ZodiacSign } from "@/lib/relationship"
import { cn } from "@/lib/utils"
import { ZODIAC_ICON_MAP } from "@/lib/zodiac"

interface WatermarkSlot {
  fallbackSign: ZodiacSign
  className: string
}

const WATERMARK_SLOTS: WatermarkSlot[] = [
  {
    fallbackSign: "Aries",
    className: "-top-4 -left-4 size-24 -rotate-12 opacity-60",
  },
  {
    fallbackSign: "Taurus",
    className: "top-6 left-[42%] size-16 rotate-12 opacity-50",
  },
  {
    fallbackSign: "Gemini",
    className: "-top-3 -right-4 size-24 rotate-12 opacity-60",
  },
  {
    fallbackSign: "Cancer",
    className: "top-[22%] left-[14%] size-16 rotate-12 opacity-45",
  },
  {
    fallbackSign: "Leo",
    className: "top-[24%] -right-5 size-28 -rotate-12 opacity-65",
  },
  {
    fallbackSign: "Virgo",
    className: "top-[42%] -left-5 size-20 rotate-12 opacity-55",
  },
  {
    fallbackSign: "Libra",
    className: "top-[44%] left-[44%] size-16 -rotate-12 opacity-45",
  },
  {
    fallbackSign: "Scorpio",
    className: "top-[56%] right-[12%] size-20 -rotate-12 opacity-55",
  },
  {
    fallbackSign: "Sagittarius",
    className: "top-[66%] left-[12%] size-16 rotate-12 opacity-50",
  },
  {
    fallbackSign: "Capricorn",
    className: "bottom-[14%] left-[48%] size-20 -rotate-12 opacity-50",
  },
  {
    fallbackSign: "Aquarius",
    className: "-bottom-4 -left-4 size-24 rotate-12 opacity-60",
  },
  {
    fallbackSign: "Pisces",
    className: "-right-4 -bottom-4 size-28 -rotate-12 opacity-65",
  },
]

function shuffleSigns(signs: ZodiacSign[]): ZodiacSign[] {
  const result = [...signs]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildSlotSigns(
  myZodiac?: ZodiacSign | null,
  partnerZodiac?: ZodiacSign | null
): ZodiacSign[] {
  if (myZodiac && partnerZodiac) {
    const pool = WATERMARK_SLOTS.map((_, index) =>
      index % 2 === 0 ? myZodiac : partnerZodiac
    )
    return shuffleSigns(pool)
  }

  const singleZodiac = myZodiac ?? partnerZodiac
  if (singleZodiac) {
    return WATERMARK_SLOTS.map(() => singleZodiac)
  }

  return WATERMARK_SLOTS.map((slot) => slot.fallbackSign)
}

interface ChatZodiacWatermarkProps {
  myZodiac?: ZodiacSign | null
  partnerZodiac?: ZodiacSign | null
}

export function ChatZodiacWatermark({
  myZodiac,
  partnerZodiac,
}: ChatZodiacWatermarkProps) {
  const slotSigns = useMemo(
    () => buildSlotSigns(myZodiac, partnerZodiac),
    [myZodiac, partnerZodiac]
  )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {WATERMARK_SLOTS.map(({ className }, index) => {
        const sign = slotSigns[index]
        const Icon = ZODIAC_ICON_MAP[sign]
        return (
          <Icon
            key={index}
            className={cn("absolute text-background", className)}
          />
        )
      })}
    </div>
  )
}

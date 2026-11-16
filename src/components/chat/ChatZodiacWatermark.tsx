import {
  type LucideIcon,
  ZodiacAquarius,
  ZodiacAries,
  ZodiacCancer,
  ZodiacCapricorn,
  ZodiacGemini,
  ZodiacLeo,
  ZodiacLibra,
  ZodiacPisces,
  ZodiacSagittarius,
  ZodiacScorpio,
  ZodiacTaurus,
  ZodiacVirgo,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ZodiacWatermarkItem {
  name: string
  Icon: LucideIcon
  className: string
}

const ZODIAC_WATERMARK_ICONS: ZodiacWatermarkItem[] = [
  {
    name: "Aries",
    Icon: ZodiacAries,
    className: "-top-4 -left-4 size-24 -rotate-12 opacity-60",
  },
  {
    name: "Taurus",
    Icon: ZodiacTaurus,
    className: "top-6 left-[42%] size-16 rotate-12 opacity-50",
  },
  {
    name: "Gemini",
    Icon: ZodiacGemini,
    className: "-top-3 -right-4 size-24 rotate-12 opacity-60",
  },
  {
    name: "Cancer",
    Icon: ZodiacCancer,
    className: "top-[22%] left-[14%] size-16 rotate-12 opacity-45",
  },
  {
    name: "Leo",
    Icon: ZodiacLeo,
    className: "top-[24%] -right-5 size-28 -rotate-12 opacity-65",
  },
  {
    name: "Virgo",
    Icon: ZodiacVirgo,
    className: "top-[42%] -left-5 size-20 rotate-12 opacity-55",
  },
  {
    name: "Libra",
    Icon: ZodiacLibra,
    className: "top-[44%] left-[44%] size-16 -rotate-12 opacity-45",
  },
  {
    name: "Scorpio",
    Icon: ZodiacScorpio,
    className: "top-[56%] right-[12%] size-20 -rotate-12 opacity-55",
  },
  {
    name: "Sagittarius",
    Icon: ZodiacSagittarius,
    className: "top-[66%] left-[12%] size-16 rotate-12 opacity-50",
  },
  {
    name: "Capricorn",
    Icon: ZodiacCapricorn,
    className: "bottom-[14%] left-[48%] size-20 -rotate-12 opacity-50",
  },
  {
    name: "Aquarius",
    Icon: ZodiacAquarius,
    className: "-bottom-4 -left-4 size-24 rotate-12 opacity-60",
  },
  {
    name: "Pisces",
    Icon: ZodiacPisces,
    className: "-right-4 -bottom-4 size-28 -rotate-12 opacity-65",
  },
]

export function ChatZodiacWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {ZODIAC_WATERMARK_ICONS.map(({ name, Icon, className }) => (
        <Icon
          key={name}
          className={cn("absolute text-background", className)}
        />
      ))}
    </div>
  )
}

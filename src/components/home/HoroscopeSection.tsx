import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "wouter"
import {
  Briefcase,
  Coins,
  Compass,
  Heart,
  type LucideIcon,
  RefreshCw,
  Smile,
  Sparkles,
  Sun,
  UserPlus,
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
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { Button } from "@/components/ui/button"
import { useHoroscopes } from "@/hooks/useHoroscopes"
import { useRelationship } from "@/hooks/useRelationship"
import type { ZodiacSign } from "@/lib/relationship"
import { cn } from "@/lib/utils"
import type { HoroscopeCategoryKey, HoroscopeRow } from "@/types/horoscope"
import type { Gender } from "@/types/relationship"

const HOROSCOPE_CATEGORY_ORDER: readonly HoroscopeCategoryKey[] = [
  "mood",
  "love",
  "money",
  "career",
  "summary",
  "advice",
]

// Tilt angles (deg) so stacked cards clearly peek out behind the top card without clipping
const CARD_TILT_DEGREES = [-5, 4.5, -4, 5, -3.5, 4] as const

interface CategoryMeta {
  label: string
  Icon: LucideIcon
  cardClass: string
  pillClass: string
}

const CATEGORY_META: Record<HoroscopeCategoryKey, CategoryMeta> = {
  mood: {
    label: "Mood",
    Icon: Smile,
    cardClass: "border-amber-600/30 bg-amber-500 text-white",
    pillClass: "bg-white/20 text-white",
  },
  love: {
    label: "Love",
    Icon: Heart,
    cardClass: "border-rose-600/30 bg-rose-500 text-white",
    pillClass: "bg-white/20 text-white",
  },
  money: {
    label: "Money",
    Icon: Coins,
    cardClass: "border-emerald-600/30 bg-emerald-500 text-white",
    pillClass: "bg-white/20 text-white",
  },
  career: {
    label: "Career",
    Icon: Briefcase,
    cardClass: "border-sky-600/30 bg-sky-500 text-white",
    pillClass: "bg-white/20 text-white",
  },
  summary: {
    label: "Summary",
    Icon: Sun,
    cardClass: "border-primary bg-primary text-primary-foreground",
    pillClass: "bg-primary-foreground/20 text-primary-foreground",
  },
  advice: {
    label: "Advice",
    Icon: Compass,
    cardClass: "border-violet-600/30 bg-violet-500 text-white",
    pillClass: "bg-white/20 text-white",
  },
}

const ZODIAC_ICON_MAP: Record<ZodiacSign, LucideIcon> = {
  Aries: ZodiacAries,
  Taurus: ZodiacTaurus,
  Gemini: ZodiacGemini,
  Cancer: ZodiacCancer,
  Leo: ZodiacLeo,
  Virgo: ZodiacVirgo,
  Libra: ZodiacLibra,
  Scorpio: ZodiacScorpio,
  Sagittarius: ZodiacSagittarius,
  Capricorn: ZodiacCapricorn,
  Aquarius: ZodiacAquarius,
  Pisces: ZodiacPisces,
}

interface HoroscopeCardItem {
  key: HoroscopeCategoryKey
  label: string
  Icon: LucideIcon
  cardClass: string
  pillClass: string
  text: string
}

function buildHoroscopeCards(row: HoroscopeRow | null): HoroscopeCardItem[] {
  const content = row?.content
  if (!content) return []

  return HOROSCOPE_CATEGORY_ORDER.reduce<HoroscopeCardItem[]>((acc, key) => {
    const raw = content[key]
    const text = typeof raw === "string" ? raw.trim() : ""
    if (!text) return acc

    const meta = CATEGORY_META[key]
    acc.push({
      key,
      label: meta.label,
      Icon: meta.Icon,
      cardClass: meta.cardClass,
      pillClass: meta.pillClass,
      text,
    })
    return acc
  }, [])
}

function ZodiacWatermark({
  ZodiacIcon,
  className,
}: {
  ZodiacIcon: LucideIcon | null
  className?: string
}) {
  if (!ZodiacIcon) return null

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none",
        className ?? "text-background/20"
      )}
    >
      <ZodiacIcon className="absolute -right-5 -bottom-5 size-26 -rotate-12" />
      <ZodiacIcon className="absolute -top-3 -left-3 size-12 rotate-12 opacity-75" />
    </div>
  )
}

function getCoverGenderStyles(gender?: Gender | null) {
  if (gender === "male") {
    return {
      card: "border-sky-500/30 bg-sky-100 ring-1 ring-sky-500/20 text-foreground dark:bg-sky-950",
      pill: "bg-background/80 text-sky-600 dark:text-sky-400",
      accent: "text-sky-600 dark:text-sky-400",
      subtext: "text-muted-foreground",
      watermark: "text-background opacity-70",
    }
  }
  if (gender === "female") {
    return {
      card: "border-rose-500/30 bg-rose-100 ring-1 ring-rose-500/20 text-foreground dark:bg-rose-950",
      pill: "bg-background/80 text-rose-600 dark:text-rose-400",
      accent: "text-rose-600 dark:text-rose-400",
      subtext: "text-muted-foreground",
      watermark: "text-background opacity-70",
    }
  }
  return {
    card: "border-primary bg-primary text-primary-foreground",
    pill: "bg-background/20 text-primary-foreground",
    accent: "text-primary-foreground/80",
    subtext: "text-primary-foreground/75",
    watermark: "text-background/20",
  }
}

interface HoroscopeDeckProps {
  coverTitle: string
  gender?: Gender | null
  zodiac: ZodiacSign | null
  horoscope: HoroscopeRow | null
  isOpened: boolean
  onOpen: () => void
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  emptyBirthDateContent: React.ReactNode
}

const HoroscopeDeck = memo(function HoroscopeDeck({
  coverTitle,
  gender,
  zodiac,
  horoscope,
  isOpened,
  onOpen,
  isLoading,
  isError,
  onRetry,
  emptyBirthDateContent,
}: HoroscopeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSwitching, setIsSwitching] = useState(false)
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cards = buildHoroscopeCards(horoscope)
  const safeIndex = cards.length > 0 ? activeIndex % cards.length : 0
  const ZodiacIcon = zodiac ? ZODIAC_ICON_MAP[zodiac] : null

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
    }
  }, [])

  const triggerSwitch = useCallback((nextAction: () => void) => {
    setIsSwitching((prev) => {
      if (prev) return prev
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current)
      switchTimerRef.current = setTimeout(() => {
        nextAction()
        setIsSwitching(false)
        switchTimerRef.current = null
      }, 180)
      return true
    })
  }, [])

  // Auto-cycle every 5 seconds infinitely once opened
  useEffect(() => {
    if (!isOpened || cards.length <= 1) return

    const autoTimer = setTimeout(() => {
      triggerSwitch(() => setActiveIndex((prev) => (prev + 1) % cards.length))
    }, 5000)

    return () => {
      clearTimeout(autoTimer)
    }
  }, [isOpened, cards.length, activeIndex, triggerSwitch])

  const handleTap = () => {
    if (isSwitching) return
    if (!isOpened) {
      triggerSwitch(onOpen)
      return
    }
    if (cards.length <= 1) return
    triggerSwitch(() => setActiveIndex((prev) => (prev + 1) % cards.length))
  }

  if (isLoading) {
    return (
      <div className="relative h-32 w-full">
        <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <CustomSkeleton className="h-4 w-20 rounded-md" />
            <CustomSkeleton className="h-4 w-9 rounded-md" />
          </div>
          <div className="space-y-2">
            <CustomSkeleton className="h-3.5 w-full rounded-md" />
            <CustomSkeleton className="h-3.5 w-5/6 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!zodiac) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 p-4 text-center">
        {emptyBirthDateContent}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card/80 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Couldn&apos;t load horoscope
        </p>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onRetry}
          className="h-7 gap-1 px-2.5 text-xs text-primary"
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="relative flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-card/70 p-4 text-center">
        <ZodiacWatermark
          ZodiacIcon={ZodiacIcon}
          className="text-primary/12"
        />
        <p className="relative z-10 text-xs leading-snug text-muted-foreground">
          No horoscope for today yet
        </p>
      </div>
    )
  }

  // Visible stack layers behind the front card (up to 3 peeking colored cards)
  const trailingOffsets = [1, 2, 3]
    .filter((offset) => offset < cards.length)
    .reverse()

  return (
    <div className="relative h-32 w-full select-none">
      {/* Trailing tilted stack layers */}
      {trailingOffsets.map((offset) => {
        const cardIdx = isOpened
          ? (safeIndex + offset) % cards.length
          : (offset - 1) % cards.length
        const trailingCard = cards[cardIdx]
        const tilt =
          CARD_TILT_DEGREES[
            (cardIdx + (isOpened ? 0 : 1)) % CARD_TILT_DEGREES.length
          ]
        const scale = 1 - offset * 0.035
        const translateY = offset * 4

        return (
          <div
            key={`stack-${offset}`}
            aria-hidden="true"
            style={{
              transform: `translate3d(0, ${translateY}px, 0) scale(${scale}) rotate(${tilt}deg)`,
            }}
            className={cn(
              "pointer-events-none absolute inset-0 transform-gpu rounded-2xl border transition-transform duration-300 ease-out",
              trailingCard.cardClass,
              offset === 1 ? "opacity-90" : offset === 2 ? "opacity-75" : "opacity-60"
            )}
          />
        )
      })}

      {/* Front interactive card: Cover Card (removed on tap) or active category card */}
      {!isOpened ? (
        (() => {
          const coverStyles = getCoverGenderStyles(gender)
          return (
            <button
              type="button"
              onClick={handleTap}
              aria-label={`${coverTitle} (${zodiac}). Tap to open.`}
              className={cn(
                "relative z-10 flex h-full w-full transform-gpu cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left shadow-sm transition-[transform,opacity] duration-200 ease-out",
                coverStyles.card,
                isSwitching
                  ? "translate-x-4 -translate-y-3 scale-95 rotate-12 opacity-0"
                  : "translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100"
              )}
            >
              <ZodiacWatermark
                ZodiacIcon={ZodiacIcon}
                className={coverStyles.watermark}
              />

              <div className="relative z-10 flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    coverStyles.pill
                  )}
                >
                  {ZodiacIcon && <ZodiacIcon className="size-2.5 shrink-0" />}
                  <span>{zodiac}</span>
                </span>
                <Sparkles className={cn("size-3.5", coverStyles.accent)} />
              </div>

              <div className="relative z-10 flex flex-col gap-0.5">
                <span className="text-xs leading-snug font-semibold">
                  {coverTitle}
                </span>
                <span className={cn("text-[10px]", coverStyles.subtext)}>
                  Tap to open
                </span>
              </div>
            </button>
          )
        })()
      ) : (
        (() => {
          const activeCard = cards[safeIndex]
          const ActiveIcon = activeCard.Icon

          return (
            <button
              type="button"
              onClick={handleTap}
              aria-label={`${activeCard.label} horoscope (${safeIndex + 1} of ${cards.length}). Tap for next.`}
              className={cn(
                "relative z-10 flex h-full w-full transform-gpu flex-col justify-between gap-1.5 overflow-hidden rounded-2xl border p-3.5 text-left shadow-sm transition-[transform,opacity] duration-200 ease-out",
                activeCard.cardClass,
                cards.length > 1 && "cursor-pointer",
                isSwitching
                  ? "translate-x-4 -translate-y-3 scale-95 rotate-12 opacity-0"
                  : "translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100"
              )}
            >
              <ZodiacWatermark
                ZodiacIcon={ZodiacIcon}
                className="text-background/20"
              />

              <div className="relative z-10 flex w-full items-center justify-between gap-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <ActiveIcon className="size-3.5 shrink-0" />
                  <span>{activeCard.label}</span>
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums",
                    activeCard.pillClass
                  )}
                >
                  {safeIndex + 1}/{cards.length}
                </span>
              </div>

              <p className="relative z-10 line-clamp-3 text-xs leading-snug text-current/95">
                {activeCard.text}
              </p>
            </button>
          )
        })()
      )}
    </div>
  )
})

export function HoroscopeSection() {
  const [, setLocation] = useLocation()
  const { currentMember, partnerMember } = useRelationship()
  const {
    myZodiac,
    partnerZodiac,
    myHoroscope,
    partnerHoroscope,
    isMyHoroscopeOpened,
    isPartnerHoroscopeOpened,
    markHoroscopeOpened,
    isLoading,
    isError,
    refetch,
  } = useHoroscopes()

  return (
    <div
      role="region"
      aria-label="Today's Horoscopes"
      className="scrollbar-none flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 pt-5 pb-7 [-webkit-overflow-scrolling:touch]"
    >
      <div className="w-[86%] shrink-0 snap-start pl-4">
        <HoroscopeDeck
          coverTitle="Open your horoscope today"
          gender={currentMember?.content?.gender}
          zodiac={myZodiac}
          horoscope={myHoroscope}
          isOpened={isMyHoroscopeOpened}
          onOpen={() => markHoroscopeOpened("self")}
          isLoading={Boolean(myZodiac && isLoading)}
          isError={Boolean(myZodiac && isError)}
          onRetry={() => void refetch()}
          emptyBirthDateContent={
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs leading-snug text-muted-foreground">
                Set birth date for your horoscope
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setLocation("/setting/profile")}
                className="h-7 border-primary/30 px-2.5 text-[11px] font-medium text-primary hover:bg-primary/10"
              >
                Set Birth Date
              </Button>
            </div>
          }
        />
      </div>

      <div className="w-[86%] shrink-0 snap-end pr-4">
        <HoroscopeDeck
          coverTitle="Open partner's horoscope today"
          gender={partnerMember?.content?.gender}
          zodiac={partnerZodiac}
          horoscope={partnerHoroscope}
          isOpened={isPartnerHoroscopeOpened}
          onOpen={() => markHoroscopeOpened("partner")}
          isLoading={Boolean(partnerZodiac && isLoading)}
          isError={Boolean(partnerZodiac && isError)}
          onRetry={() => void refetch()}
          emptyBirthDateContent={
            partnerMember ? (
              <p className="text-xs leading-snug text-muted-foreground">
                Partner hasn&apos;t set their birth date yet
              </p>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <UserPlus className="size-4 opacity-60" />
                <p className="text-xs leading-snug">Waiting for partner</p>
              </div>
            )
          }
        />
      </div>
    </div>
  )
}

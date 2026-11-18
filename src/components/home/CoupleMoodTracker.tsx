import type { ReactNode } from "react"
import { formatDistanceToNow } from "date-fns"
import { useTranslation } from "react-i18next"
import {
  ChessKing,
  ChessQueen,
  Compass,
  Flower2,
  Gem,
  Heart,
  type LucideIcon,
  Mars,
  Shield,
  Smile,
  Sparkles,
  Sword,
  UserPlus,
  Venus,
} from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { OdometerText } from "@/components/OdometerText"
import { getDateFnsLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useActivities } from "@/hooks/useActivities"
import { useRelationship } from "@/hooks/useRelationship"
import type { Activity, MoodActivityContent } from "@/types/activity"
import type { Gender } from "@/types/relationship"

function getGenderRingStyles(gender?: Gender | null) {
  if (gender === "male") {
    return {
      card: "border-sky-500/30 bg-sky-100 ring-1 ring-sky-500/20 dark:bg-sky-950",
      circle:
        "bg-background/80 ring-2 ring-sky-500/50 text-sky-600 dark:ring-sky-400/50 dark:text-sky-400",
      watermark: "text-background",
    }
  }
  if (gender === "female") {
    return {
      card: "border-rose-500/30 bg-rose-100 ring-1 ring-rose-500/20 dark:bg-rose-950",
      circle:
        "bg-background/80 ring-2 ring-rose-500/50 text-rose-600 dark:ring-rose-400/50 dark:text-rose-400",
      watermark: "text-background",
    }
  }
  return {
    card: "border-border bg-card",
    circle: "bg-muted/40 ring-1 ring-border text-muted-foreground",
    watermark: null,
  }
}

interface WatermarkIconItem {
  Icon: LucideIcon
  className: string
}

const GENDER_WATERMARK_ICONS: Record<Gender, WatermarkIconItem[]> = {
  male: [
    {
      Icon: Mars,
      className: "-right-5 -bottom-5 size-28 -rotate-12 opacity-70",
    },
    {
      Icon: ChessKing,
      className: "-top-3 -right-2 size-16 rotate-12 opacity-60",
    },
    {
      Icon: Compass,
      className: "top-10 -left-4 size-14 -rotate-12 opacity-55",
    },
    {
      Icon: Sword,
      className: "-bottom-3 -left-3 size-16 rotate-45 opacity-60",
    },
    {
      Icon: Shield,
      className: "top-1/2 -right-5 size-14 -translate-y-1/2 -rotate-12 opacity-45",
    },
  ],
  female: [
    {
      Icon: Venus,
      className: "-right-5 -bottom-5 size-28 -rotate-12 opacity-70",
    },
    {
      Icon: ChessQueen,
      className: "-top-3 -right-2 size-16 rotate-12 opacity-60",
    },
    {
      Icon: Sparkles,
      className: "top-10 -left-4 size-14 rotate-12 opacity-55",
    },
    {
      Icon: Gem,
      className: "-bottom-3 -left-3 size-16 -rotate-12 opacity-60",
    },
    {
      Icon: Flower2,
      className: "top-1/2 -right-5 size-14 -translate-y-1/2 rotate-12 opacity-45",
    },
  ],
}

interface MoodCardProps {
  avatar: string
  title: ReactNode
  gender?: Gender | null
  latestMood: Activity<MoodActivityContent> | null
  isLoading: boolean
  emptyLabel: string
  fallbackIcon: ReactNode
}

function MoodCard({
  avatar,
  title,
  gender,
  latestMood,
  isLoading,
  emptyLabel,
  fallbackIcon,
}: MoodCardProps) {
  const { t, i18n } = useTranslation("home")
  const styles = getGenderRingStyles(gender)
  const moodContent = latestMood?.content

  const primaryLabel = isLoading
    ? t("mood.loading")
    : moodContent
      ? moodContent.label
      : emptyLabel

  const secondaryNote =
    !isLoading && moodContent
      ? moodContent.note
        ? `"${moodContent.note}"`
        : t("mood.checkedIn")
      : ""

  const timestampText =
    !isLoading && latestMood
      ? formatDistanceToNow(new Date(latestMood.created_at), {
          addSuffix: true,
          locale: getDateFnsLocale(i18n.language),
        })
      : ""

  const watermarkIcons = gender ? GENDER_WATERMARK_ICONS[gender] : null

  return (
    <CustomItem
      variant="default"
      className={cn(
        "relative h-full flex-nowrap items-center justify-between gap-3 text-center shadow-sm",
        styles.card
      )}
      background={
        watermarkIcons && styles.watermark ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 overflow-hidden select-none",
              styles.watermark
            )}
            aria-hidden="true"
          >
            {watermarkIcons.map(({ Icon, className }, index) => (
              <Icon key={index} className={cn("absolute", className)} />
            ))}
          </div>
        ) : null
      }
      headerClassName="relative z-10"
      icon={
        <AnimatedEmoji
          emoji={avatar}
          size={16}
          replayOnTap={false}
          fallbackClassName="text-xs leading-none"
        />
      }
      title={title}
      contentHorizontalAlign="center"
      contentClassName="z-10 flex-none items-center justify-center gap-2 py-0.5"
    >
      {/* Centered Big Icon & Mood Status */}
      {isLoading ? (
        <CustomSkeleton className="size-16 shrink-0 rounded-full" />
      ) : (
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full transition-transform",
            styles.circle
          )}
        >
          {moodContent ? (
            <div
              key={latestMood?.id ?? moodContent.emoji}
              className="flex animate-in items-center justify-center duration-300 zoom-in-75"
            >
              <AnimatedEmoji
                emoji={moodContent.emoji}
                size={52}
                fallbackClassName="text-4xl"
              />
            </div>
          ) : (
            fallbackIcon
          )}
        </div>
      )}

      {/* Consistent 3-line text stack to preserve identical card height */}
      <div className="flex w-full min-w-0 flex-col items-center justify-center gap-0.5 text-center">
        {isLoading ? (
          <>
            <CustomSkeleton className="my-0.5 h-3.5 w-16 rounded-md" />
            <CustomSkeleton className="my-0.5 h-3 w-20 rounded-md" />
            <CustomSkeleton className="my-0.5 h-2.5 w-14 rounded-md" />
          </>
        ) : (
          <>
            <span
              className={cn(
                "w-full truncate text-center text-xs font-semibold",
                moodContent
                  ? "text-foreground"
                  : "text-[11px] font-medium text-muted-foreground"
              )}
            >
              {primaryLabel}
            </span>

            <p
              className={cn(
                "line-clamp-1 min-h-4 w-full text-center text-[11px]",
                moodContent?.note
                  ? "text-muted-foreground italic"
                  : "text-muted-foreground/70"
              )}
            >
              {secondaryNote}
            </p>

            <span className="min-h-3.5 text-[10px] text-muted-foreground">
              {timestampText}
            </span>
          </>
        )}
      </div>
    </CustomItem>
  )
}

function YourMood() {
  const { t } = useTranslation("home")
  const { myLatestMood, isLoading } = useActivities()
  const { currentMember, currentAlias } = useRelationship()

  return (
    <MoodCard
      avatar={currentMember?.content?.avatar || "💙"}
      title={<OdometerText items={[t("mood.you"), currentAlias]} />}
      gender={currentMember?.content?.gender}
      latestMood={myLatestMood}
      isLoading={isLoading}
      emptyLabel={t("mood.tapToLog")}
      fallbackIcon={<Smile className="size-7 opacity-75" />}
    />
  )
}

function PartnerMood() {
  const { t } = useTranslation("home")
  const { partnerLatestMood, isLoading } = useActivities()
  const { partnerMember, partnerName, partnerAlias } = useRelationship()

  return (
    <MoodCard
      avatar={partnerMember?.content?.avatar || "🤍"}
      title={<OdometerText items={[partnerName, partnerAlias]} />}
      gender={partnerMember?.content?.gender}
      latestMood={partnerMember ? partnerLatestMood : null}
      isLoading={Boolean(partnerMember && isLoading)}
      emptyLabel={
        partnerMember ? t("mood.noMoodYet") : t("mood.waitingPartner")
      }
      fallbackIcon={
        partnerMember ? (
          <Heart className="size-7 opacity-75" />
        ) : (
          <UserPlus className="size-7 opacity-60" />
        )
      }
    />
  )
}

export { YourMood, PartnerMood }

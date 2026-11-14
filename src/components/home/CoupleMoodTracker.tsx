import type { ReactNode } from "react"
import { formatDistanceToNow } from "date-fns"
import { Heart, Smile, UserPlus } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useActivities } from "@/hooks/useActivities"
import { useRelationship } from "@/hooks/useRelationship"
import type { Activity, MoodActivityContent } from "@/types/activity"
import type { Gender } from "@/types/relationship"

function getGenderRingStyles(gender?: Gender | null) {
  if (gender === "male") {
    return {
      card: "border-blue-500/30 ring-1 ring-blue-500/20",
      circle:
        "bg-blue-500/10 ring-2 ring-blue-500/50 text-blue-600 dark:bg-blue-400/10 dark:ring-blue-400/50 dark:text-blue-400",
    }
  }
  if (gender === "female") {
    return {
      card: "border-primary/30 ring-1 ring-primary/20",
      circle:
        "bg-primary/10 ring-2 ring-primary/50 text-primary",
    }
  }
  return {
    card: "border-border",
    circle: "bg-muted/40 ring-1 ring-border text-muted-foreground",
  }
}

interface MoodCardProps {
  avatar: string
  title: string
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
  const styles = getGenderRingStyles(gender)
  const moodContent = latestMood?.content

  const primaryLabel = isLoading
    ? "Loading..."
    : moodContent
      ? moodContent.label
      : emptyLabel

  const secondaryNote =
    !isLoading && moodContent
      ? moodContent.note
        ? `"${moodContent.note}"`
        : "Checked in"
      : ""

  const timestampText =
    !isLoading && latestMood
      ? formatDistanceToNow(new Date(latestMood.created_at), {
          addSuffix: true,
        })
      : ""

  return (
    <CustomItem
      variant="default"
      className={cn(
        "h-full flex-nowrap items-center justify-between gap-3 text-center",
        styles.card
      )}
      icon={<span className="text-xs leading-none">{avatar}</span>}
      title={title}
      contentHorizontalAlign="center"
      contentClassName="flex-none items-center justify-center gap-2 py-0.5"
    >
      {/* Centered Big Icon & Mood Status */}
      {isLoading ? (
        <Skeleton className="size-14 shrink-0 rounded-full" />
      ) : (
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full transition-transform",
            styles.circle
          )}
        >
          {moodContent ? (
            <span className="text-3xl leading-none select-none">
              {moodContent.emoji}
            </span>
          ) : (
            fallbackIcon
          )}
        </div>
      )}

      {/* Consistent 3-line text stack to preserve identical card height */}
      <div className="flex w-full min-w-0 flex-col items-center justify-center text-center gap-0.5">
        {isLoading ? (
          <>
            <Skeleton className="my-0.5 h-3.5 w-16 rounded-md" />
            <Skeleton className="my-0.5 h-3 w-20 rounded-md" />
            <Skeleton className="my-0.5 h-2.5 w-14 rounded-md" />
          </>
        ) : (
          <>
            <span
              className={cn(
                "w-full truncate text-center text-xs font-semibold",
                moodContent ? "text-foreground" : "text-[11px] font-medium text-muted-foreground"
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
  const { myLatestMood, isLoading } = useActivities()
  const { currentMember } = useRelationship()

  return (
    <MoodCard
      avatar={currentMember?.content?.avatar || "🙋"}
      title="You"
      gender={currentMember?.content?.gender}
      latestMood={myLatestMood}
      isLoading={isLoading}
      emptyLabel="Tap + to log mood"
      fallbackIcon={<Smile className="size-6 opacity-75" />}
    />
  )
}

function PartnerMood() {
  const { partnerLatestMood, isLoading } = useActivities()
  const { partnerMember } = useRelationship()

  return (
    <MoodCard
      avatar={partnerMember?.content?.avatar || "🤍"}
      title={partnerMember?.content?.name || "Partner"}
      gender={partnerMember?.content?.gender}
      latestMood={partnerMember ? partnerLatestMood : null}
      isLoading={Boolean(partnerMember && isLoading)}
      emptyLabel={partnerMember ? "No mood logged yet" : "Waiting for partner"}
      fallbackIcon={
        partnerMember ? (
          <Heart className="size-6 opacity-75" />
        ) : (
          <UserPlus className="size-6 opacity-60" />
        )
      }
    />
  )
}

export { YourMood, PartnerMood }

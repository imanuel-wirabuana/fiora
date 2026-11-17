import { memo, useMemo, useState } from "react"
import { format, isToday, isYesterday } from "date-fns"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { CustomTabs, type CustomTabItem } from "@/components/CustomTabs"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useInfiniteTimelineActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useRelationship } from "@/hooks/useRelationship"
import { getGenderAvatarCircleClass } from "@/lib/relationship"
import { cn } from "@/lib/utils"
import type {
  Activity,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"
import type { Gender } from "@/types/relationship"

type TimelineFilter = "all" | "mood" | "nudge"

const FILTER_OPTIONS: CustomTabItem<TimelineFilter>[] = [
  { value: "all", label: "All" },
  { value: "mood", label: "Mood" },
  { value: "nudge", label: "Nudge" },
]

interface InsightTimelineSectionProps {
  startDate?: Date
  endDate?: Date
}

const TimelineActivityRow = memo(function TimelineActivityRow({
  activity,
  authorName,
  authorAvatar,
  authorGender,
  isMine,
}: {
  activity: Activity
  authorName: string
  authorAvatar: string
  authorGender?: Gender | null
  isMine: boolean
}) {
  const isMood = activity.type === "mood"
  const content = activity.content as
    | MoodActivityContent
    | NudgeActivityContent
    | null

  if (!content) return null

  const note = isMood ? (content as MoodActivityContent).note : undefined
  const date = new Date(activity.created_at)
  const timeText =
    isToday(date) || isYesterday(date)
      ? format(date, "h:mm a")
      : format(date, "MMM d, h:mm a")

  return (
    <CustomItem
      variant={isMood ? "default" : "soft"}
      title={isMine ? "You" : authorName}
      icon={
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm leading-none select-none",
            getGenderAvatarCircleClass(
              authorGender,
              isMood ? "bg-muted/60" : "bg-primary/15"
            )
          )}
        >
          {authorAvatar}
        </div>
      }
      topRightActions={
        <span className="text-[10px] text-muted-foreground">{timeText}</span>
      }
      bottomRightActions={
        <Badge
          variant={isMood ? "secondary" : "outline"}
          className={cn(
            "rounded-full px-1.5 py-0 text-[10px] font-medium",
            !isMood && "border-primary/30 text-primary"
          )}
        >
          {isMood ? "Mood" : "Nudge"}
        </Badge>
      }
      className="gap-1.5 rounded-2xl p-2.5 [contain-intrinsic-size:auto_76px] [content-visibility:auto]"
    >
      <div className="flex items-center gap-2">
        <AnimatedEmoji emoji={content.emoji} size={22} loop={false} replayOnTap />
        <span className="text-xs font-medium text-foreground">
          {content.label}
        </span>
      </div>

      {note && (
        <p
          className={cn(
            "mt-1 w-full rounded-lg px-2 py-1 text-[11px]",
            isMood
              ? "bg-muted/40 text-foreground/90"
              : "bg-background/60 text-foreground/90"
          )}
        >
          {note}
        </p>
      )}
    </CustomItem>
  )
})

export function InsightTimelineSection({
  startDate,
  endDate,
}: InsightTimelineSectionProps) {
  const { user } = useAuth()
  const { currentMember, partnerMember } = useRelationship()
  const {
    timelineActivities,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTimelineActivities()

  const [typeFilter, setTypeFilter] = useState<TimelineFilter>("all")

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const myAvatar = currentMember?.content?.avatar || "💙"
  const myGender = currentMember?.content?.gender
  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const partnerGender = partnerMember?.content?.gender
  const currentUserId = user?.id

  const filteredActivities = useMemo(() => {
    return timelineActivities.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false
      const createdAt = new Date(item.created_at)
      if (startDate && createdAt < startDate) return false
      if (endDate && createdAt > endDate) return false
      return true
    })
  }, [timelineActivities, typeFilter, startDate, endDate])

  const grouped = useMemo(() => {
    const today: Activity[] = []
    const yesterday: Activity[] = []
    const earlier: Activity[] = []

    for (const item of filteredActivities) {
      const date = new Date(item.created_at)
      if (isToday(date)) {
        today.push(item)
      } else if (isYesterday(date)) {
        yesterday.push(item)
      } else {
        earlier.push(item)
      }
    }

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0)
  }, [filteredActivities])

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          Timeline
        </span>

        <CustomTabs
          size="sm"
          items={FILTER_OPTIONS}
          value={typeFilter}
          onValueChange={setTypeFilter}
          className="max-w-42"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
          No mood or nudge activity in this range.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {grouped.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {group.items.length}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {group.items.map((activity) => {
                  const isMine = activity.user_id === currentUserId
                  return (
                    <TimelineActivityRow
                      key={activity.id}
                      activity={activity}
                      authorName={partnerName}
                      authorAvatar={isMine ? myAvatar : partnerAvatar}
                      authorGender={isMine ? myGender : partnerGender}
                      isMine={isMine}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-2" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

import { useCallback, useMemo, useState } from "react"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { Heart, Send, Sparkles } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { useAuth } from "@/hooks/useAuth"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useRelationship } from "@/hooks/useRelationship"
import type {
  Activity,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"
import type { TimelineItem } from "@/types/timeline"

const TIMELINE_WINDOW_SIZE = 20

interface TimelineFeedSectionProps {
  items: TimelineItem[]
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  selectedDate: Date | undefined
}

export function TimelineFeedSection({
  items,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  selectedDate,
}: TimelineFeedSectionProps) {
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()
  const [visibleCount, setVisibleCount] = useState(TIMELINE_WINDOW_SIZE)

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  )
  const hasMoreVisible = visibleCount < items.length
  const canLoadMore = hasMoreVisible || hasNextPage

  const handleLoadMore = useCallback(() => {
    if (visibleCount < items.length) {
      setVisibleCount((prev) => prev + TIMELINE_WINDOW_SIZE)
    }
    if (hasNextPage && !isFetchingNextPage && visibleCount + TIMELINE_WINDOW_SIZE >= items.length) {
      fetchNextPage?.()
    }
  }, [visibleCount, items.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useInfiniteScroll({
    hasNextPage: canLoadMore,
    isFetchingNextPage,
    fetchNextPage: handleLoadMore,
  })

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const myAvatar = currentMember?.content?.avatar || "💙"

  const getMemberInfo = (userId: string) => {
    if (userId === user?.id) {
      return {
        name: "You",
        avatar: myAvatar,
        isMe: true,
      }
    }
    return {
      name: partnerName,
      avatar: partnerAvatar,
      isMe: false,
    }
  }

  const formatItemTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const exactTime = format(date, "h:mm a")
    if (isToday(date)) {
      return `${exactTime} · ${formatDistanceToNow(date, { addSuffix: true })}`
    }
    return `${format(date, "MMM d")} · ${exactTime}`
  }

  const renderActivityItem = (activity: Activity, key: string) => {
    const member = getMemberInfo(activity.user_id)

    if (activity.type === "mood") {
      const content = activity.content as MoodActivityContent | null
      if (!content) return null

      return (
        <CustomItem
          key={key}
          variant="default"
          className="gap-1.5 rounded-2xl p-3 transition-colors"
          icon={<Heart className="size-4 fill-primary text-primary" />}
          title={
            <span className="inline-flex items-center gap-1">
              <AnimatedEmoji
                emoji={member.avatar}
                size={16}
                replayOnTap={false}
                fallbackClassName="text-xs"
              />
              <span>{member.name} · Mood</span>
            </span>
          }
          topRightActions={
            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
              {formatItemTime(activity.created_at)}
            </span>
          }
          contentClassName="space-y-1.5 pl-6"
        >
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
            <AnimatedEmoji
              emoji={content.emoji}
              size={16}
              replayOnTap={false}
              fallbackClassName="text-xs"
            />
            <span>{content.label}</span>
          </span>

          {content.note && (
            <div className="border-l-2 border-primary/40 pl-2 text-[11px] leading-relaxed break-words text-muted-foreground italic">
              "{content.note}"
            </div>
          )}
        </CustomItem>
      )
    }

    if (activity.type === "nudge") {
      const content = activity.content as NudgeActivityContent | null
      if (!content) return null

      const receiverName = member.isMe ? partnerName : "You"
      const receiverAvatar = member.isMe ? partnerAvatar : myAvatar

      return (
        <CustomItem
          key={key}
          variant="soft"
          className="gap-1.5 rounded-2xl p-3 transition-colors"
          icon={<Send className="size-4 text-amber-500" />}
          title={
            <span className="inline-flex items-center gap-1">
              <AnimatedEmoji
                emoji={member.avatar}
                size={16}
                replayOnTap={false}
                fallbackClassName="text-xs"
              />
              <span>{member.name} →</span>
              <AnimatedEmoji
                emoji={receiverAvatar}
                size={16}
                replayOnTap={false}
                fallbackClassName="text-xs"
              />
              <span>{receiverName}</span>
            </span>
          }
          topRightActions={
            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
              {formatItemTime(activity.created_at)}
            </span>
          }
          contentClassName="pl-6"
        >
          <span className="inline-flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
            <AnimatedEmoji
              emoji={content.emoji}
              size={16}
              replayOnTap={false}
              fallbackClassName="text-xs"
            />
            <span>{content.label}</span>
          </span>
        </CustomItem>
      )
    }

    return null
  }

  const groupedSections = useMemo(() => {
    const todayItems: TimelineItem[] = []
    const yesterdayItems: TimelineItem[] = []
    const earlierItems: TimelineItem[] = []

    for (const item of visibleItems) {
      const date = new Date(item.created_at)
      if (isToday(date)) {
        todayItems.push(item)
      } else if (isYesterday(date)) {
        yesterdayItems.push(item)
      } else {
        earlierItems.push(item)
      }
    }

    return [
      { label: "Today", items: todayItems },
      { label: "Yesterday", items: yesterdayItems },
      { label: "Earlier", items: earlierItems },
    ].filter((group) => group.items.length > 0)
  }, [visibleItems])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <CustomSkeleton className="h-3.5 w-14 rounded-md" />
            <CustomSkeleton className="h-3 w-5 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <CustomSkeleton key={idx} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <Sparkles className="size-8 opacity-40" />
        <p className="text-[11px]">
          {selectedDate
            ? isToday(selectedDate)
              ? "No activities recorded today yet."
              : `No activities recorded on ${format(selectedDate, "MMM d, yyyy")}.`
            : "No activities recorded yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groupedSections.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {group.items.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="[content-visibility:auto] [contain-intrinsic-size:auto_96px]"
              >
                {renderActivityItem(item.activity, item.id)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex flex-col gap-2">
          <CustomSkeleton className="h-20 w-full" />
          <CustomSkeleton className="h-20 w-full" />
        </div>
      )}
    </div>
  )
}

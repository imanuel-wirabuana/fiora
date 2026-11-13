import { format, formatDistanceToNow, isToday } from "date-fns"
import {
  Heart,
  HelpCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
import type {
  Activity,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"
import type { QuizTimelineEntry } from "@/types/quiz"
import type { TimelineItem } from "@/types/timeline"

interface TimelineFeedSectionProps {
  items: TimelineItem[]
  isLoading: boolean
  selectedDate: Date | undefined
}

export function TimelineFeedSection({
  items,
  isLoading,
  selectedDate,
}: TimelineFeedSectionProps) {
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const myAvatar = currentMember?.content?.avatar || "🙋"

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
      return `${exactTime} (${formatDistanceToNow(date, { addSuffix: true })})`
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
          className="gap-1.5 rounded-xl p-2.5 transition-colors"
          icon={<span className="text-sm leading-none">{member.avatar}</span>}
          title={`${member.name} · Mood`}
          topRightActions={
            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
              {formatItemTime(activity.created_at)}
            </span>
          }
          contentClassName="space-y-1.5"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-rose-500/30 bg-rose-500/5 px-1.5 py-0 text-[10px] font-normal text-rose-600 dark:text-rose-400"
            >
              <Heart className="size-2.5 fill-rose-500 text-rose-500" />
              Mood
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-foreground">
              <span>{content.emoji}</span>
              <span>{content.label}</span>
            </span>
          </div>

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
          className="gap-1.5 rounded-xl p-2.5 transition-colors"
          icon={<span className="text-sm leading-none">{member.avatar}</span>}
          title={`${member.name} → ${receiverName}`}
          topRightActions={
            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
              {formatItemTime(activity.created_at)}
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-xs">{receiverAvatar}</span>
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-primary/25 bg-primary/15 px-1.5 py-0 text-[10px] font-normal text-primary"
            >
              <MessageCircle className="size-2.5 text-primary" />
              Nudge
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-xs font-medium text-foreground">
              <span>{content.emoji}</span>
              <span>{content.label}</span>
            </span>
          </div>
        </CustomItem>
      )
    }

    return null
  }

  const renderQuizItem = (
    entry: QuizTimelineEntry,
    createdAt: string,
    key: string
  ) => {
    const qContent = entry.quiz.content
    if (!qContent) return null

    const myChoice = entry.myAnswer?.content?.selectedOption
    const partnerChoice = entry.partnerAnswer?.content?.selectedOption
    const tag = qContent.tags?.[0]

    return (
      <CustomItem
        key={key}
        variant="outline"
        className="gap-1.5 rounded-xl p-2.5 transition-colors"
        icon={
          <div className="flex shrink-0 -space-x-1">
            <span className="text-xs">{myAvatar}</span>
            <span className="text-xs">{partnerAvatar}</span>
          </div>
        }
        title="Daily Quiz"
        topRightActions={
          <span className="text-[10px] whitespace-nowrap text-primary/75">
            {formatItemTime(createdAt)}
          </span>
        }
        contentClassName="space-y-1.5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {tag && (
            <span className="py-0.2 shrink-0 rounded bg-muted/70 px-1.5 text-[10px] font-medium text-muted-foreground">
              #{tag}
            </span>
          )}
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 px-1.5 py-0 text-[10px] font-normal",
              entry.isMatched
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            <HelpCircle className="size-2.5 text-primary" />
            {entry.isMatched ? "Match ✨" : "Diff 💬"}
          </Badge>
        </div>

        {/* Question */}
        <p className="text-xs leading-snug font-medium break-words text-foreground">
          {qContent.question}
        </p>

        {/* Stacked Full Answers */}
        <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/20 p-2 pt-1.5 text-[11px]">
          <div className="flex min-w-0 items-start gap-1.5">
            <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
              <span>{myAvatar}</span> You:
            </span>
            <span className="flex-1 leading-snug font-medium break-words text-foreground/90">
              {myChoice || (
                <span className="font-normal text-muted-foreground italic">
                  Not answered yet
                </span>
              )}
            </span>
          </div>

          <div className="flex min-w-0 items-start gap-1.5">
            <span className="flex shrink-0 items-center gap-1 font-medium text-rose-500">
              <span>{partnerAvatar}</span> {partnerName}:
            </span>
            {entry.isBothAnswered ? (
              <span className="flex-1 leading-snug font-medium break-words text-foreground/90">
                {partnerChoice}
              </span>
            ) : (
              <span className="leading-snug font-normal text-muted-foreground italic">
                Locked until both answer 🔒
              </span>
            )}
          </div>
        </div>
      </CustomItem>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <Sparkles className="size-8 opacity-40" />
        <p className="text-xs">
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
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        if (item.type === "quiz") {
          return renderQuizItem(item.quizEntry, item.created_at, item.id)
        }

        return renderActivityItem(item.activity, item.id)
      })}
    </div>
  )
}

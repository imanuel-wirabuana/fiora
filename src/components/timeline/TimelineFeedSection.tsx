import { format, formatDistanceToNow, isToday } from "date-fns"
import { ArrowRight, Heart, HelpCircle, MessageCircle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Item, ItemContent } from "@/components/ui/item"
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

  const renderActivityBody = (activity: Activity) => {
    const member = getMemberInfo(activity.user_id)

    if (activity.type === "mood") {
      const content = activity.content as MoodActivityContent | null
      if (!content) return null

      return (
        <div className="flex flex-col gap-1 w-full">
          {/* Main inline row */}
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-sm shrink-0">{member.avatar}</span>
              <span className="text-xs font-semibold text-foreground shrink-0">
                {member.name}
              </span>
              <Badge
                variant="outline"
                className="gap-1 text-[10px] py-0 px-1.5 font-normal border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 shrink-0"
              >
                <Heart className="size-2.5 fill-rose-500 text-rose-500" />
                Mood
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-foreground">
                <span>{content.emoji}</span>
                <span>{content.label}</span>
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
              {formatItemTime(activity.created_at)}
            </span>
          </div>

          {/* Note if present */}
          {content.note && (
            <div className="border-l-2 border-primary/40 pl-2 text-[11px] text-muted-foreground italic leading-relaxed break-words mt-0.5">
              "{content.note}"
            </div>
          )}
        </div>
      )
    }

    if (activity.type === "nudge") {
      const content = activity.content as NudgeActivityContent | null
      if (!content) return null

      const receiverName = member.isMe ? partnerName : "You"
      const receiverAvatar = member.isMe ? partnerAvatar : myAvatar

      return (
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-sm shrink-0">{member.avatar}</span>
            <span className="text-xs font-semibold text-foreground shrink-0">
              {member.name}
            </span>
            <ArrowRight className="size-2.5 text-muted-foreground shrink-0" />
            <span className="text-sm shrink-0">{receiverAvatar}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {receiverName}
            </span>
            <Badge
              variant="outline"
              className="gap-1 text-[10px] py-0 px-1.5 font-normal border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 shrink-0"
            >
              <MessageCircle className="size-2.5 text-amber-500" />
              Nudge
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-medium text-foreground">
              <span>{content.emoji}</span>
              <span>{content.label}</span>
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
            {formatItemTime(activity.created_at)}
          </span>
        </div>
      )
    }

    return null
  }

  const renderQuizBody = (entry: QuizTimelineEntry, createdAt: string) => {
    const qContent = entry.quiz.content
    if (!qContent) return null

    const myChoice = entry.myAnswer?.content?.selectedOption
    const partnerChoice = entry.partnerAnswer?.content?.selectedOption
    const tag = qContent.tags?.[0]

    return (
      <div className="flex flex-col gap-1.5 w-full min-w-0">
        {/* Header line */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <div className="flex -space-x-1 shrink-0">
              <span className="text-xs">{myAvatar}</span>
              <span className="text-xs">{partnerAvatar}</span>
            </div>
            <span className="text-xs font-semibold text-foreground shrink-0">
              Daily Quiz
            </span>
            {tag && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/70 px-1.5 py-0.2 rounded shrink-0">
                #{tag}
              </span>
            )}
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-[10px] py-0 px-1.5 font-normal shrink-0",
                entry.isMatched
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              <HelpCircle className="size-2.5 text-primary" />
              {entry.isMatched ? "Match ✨" : "Diff 💬"}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
            {formatItemTime(createdAt)}
          </span>
        </div>

        {/* Question */}
        <p className="text-xs font-medium text-foreground leading-snug break-words">
          {qContent.question}
        </p>

        {/* Stacked Full Answers */}
        <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/20 p-2 text-[11px] pt-1.5">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="shrink-0 font-medium text-primary flex items-center gap-1">
              <span>{myAvatar}</span> You:
            </span>
            <span className="text-foreground/90 font-medium break-words leading-snug flex-1">
              {myChoice || <span className="italic text-muted-foreground font-normal">Not answered yet</span>}
            </span>
          </div>

          <div className="flex items-start gap-1.5 min-w-0">
            <span className="shrink-0 font-medium text-rose-500 flex items-center gap-1">
              <span>{partnerAvatar}</span> {partnerName}:
            </span>
            {entry.isBothAnswered ? (
              <span className="text-foreground/90 font-medium break-words leading-snug flex-1">
                {partnerChoice}
              </span>
            ) : (
              <span className="italic text-muted-foreground font-normal leading-snug">
                Locked until both answer 🔒
              </span>
            )}
          </div>
        </div>
      </div>
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
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
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
          return (
            <Item
              key={item.id}
              variant="outline"
              className="w-full max-w-full overflow-hidden p-2.5 rounded-xl border-border/60 hover:border-border transition-colors"
            >
              <ItemContent className="w-full min-w-0 p-0">
                {renderQuizBody(item.quizEntry, item.created_at)}
              </ItemContent>
            </Item>
          )
        }

        return (
          <Item
            key={item.id}
            variant="outline"
            className="w-full max-w-full overflow-hidden p-2.5 rounded-xl border-border/60 hover:border-border transition-colors"
          >
            <ItemContent className="w-full min-w-0 p-0">
              {renderActivityBody(item.activity)}
            </ItemContent>
          </Item>
        )
      })}
    </div>
  )
}


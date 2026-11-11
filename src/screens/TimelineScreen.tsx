import { useState, useMemo } from "react"
import { format, formatDistanceToNow, isSameDay } from "date-fns"
import { BookOpen, Calendar as CalendarIcon, Heart, MessageCircle, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
import type {
  Activity,
  ActivityType,
  JournalActivityContent,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"

type FilterType = "all" | ActivityType

export function TimelineScreen() {
  const { timelineActivities, isLoading } = useActivities()
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()

  const [typeFilter, setTypeFilter] = useState<FilterType>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Identify dates that have activities for calendar dots/styling
  const activeDays = useMemo(() => {
    return timelineActivities.map((a) => new Date(a.created_at))
  }, [timelineActivities])

  const filteredActivities = useMemo(() => {
    return timelineActivities.filter((activity) => {
      // 1. Type filter
      if (typeFilter !== "all" && activity.type !== typeFilter) {
        return false
      }
      // 2. Date filter
      if (selectedDate) {
        if (!isSameDay(new Date(activity.created_at), selectedDate)) {
          return false
        }
      }
      return true
    })
  }, [timelineActivities, typeFilter, selectedDate])

  const getMemberInfo = (userId: string) => {
    if (userId === user?.id) {
      return {
        name: "You",
        avatar: currentMember?.content?.avatar || "🙋",
        isMe: true,
      }
    }
    return {
      name: partnerMember?.content?.name || "Partner",
      avatar: partnerMember?.content?.avatar || "🤍",
      isMe: false,
    }
  }

  const renderActivityBody = (activity: Activity) => {
    if (activity.type === "mood") {
      const content = activity.content as MoodActivityContent | null
      if (!content) return null
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{content.emoji}</span>
            <span className="text-xs font-semibold">{content.label}</span>
          </div>
          {content.note && (
            <p className="text-xs text-muted-foreground italic">"{content.note}"</p>
          )}
        </div>
      )
    }

    if (activity.type === "nudge") {
      const content = activity.content as NudgeActivityContent | null
      if (!content) return null
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-lg">{content.emoji}</span>
          <span className="font-medium">Nudge: "{content.label}"</span>
        </div>
      )
    }

    if (activity.type === "journal") {
      const content = activity.content as JournalActivityContent | null
      if (!content) return null
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-foreground">{content.title}</h4>
            <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal text-muted-foreground">
              Shared
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
            {content.body}
          </p>
        </div>
      )
    }

    return null
  }

  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case "mood":
        return (
          <Badge variant="outline" className="gap-1 text-[10px] py-0 px-1.5 font-normal">
            <Heart className="size-2.5 text-rose-500 fill-rose-500" />
            Mood
          </Badge>
        )
      case "nudge":
        return (
          <Badge variant="outline" className="gap-1 text-[10px] py-0 px-1.5 font-normal">
            <MessageCircle className="size-2.5 text-amber-500" />
            Nudge
          </Badge>
        )
      case "journal":
        return (
          <Badge variant="outline" className="gap-1 text-[10px] py-0 px-1.5 font-normal">
            <BookOpen className="size-2.5 text-blue-500" />
            Journal
          </Badge>
        )
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (selectedDate && date && isSameDay(selectedDate, date)) {
      setSelectedDate(undefined)
    } else {
      setSelectedDate(date)
    }
    setIsCalendarOpen(false)
  }

  return (
    <section className="flex flex-col gap-3">
      {/* Compact Controls: Type Filter Tabs + Date Popover */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(["all", "mood", "nudge", "journal"] as const).map((tab) => (
            <Button
              key={tab}
              variant={typeFilter === tab ? "default" : "outline"}
              size="xs"
              onClick={() => setTypeFilter(tab)}
              className="capitalize rounded-full px-3 text-xs h-7"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Compact Date Picker Popover */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger
            render={
              <Button
                variant={selectedDate ? "default" : "outline"}
                size="xs"
                className={cn(
                  "h-7 gap-1.5 px-2.5 rounded-full text-xs shrink-0",
                  selectedDate && "bg-primary text-primary-foreground"
                )}
              />
            }
          >
            <CalendarIcon className="size-3.5" />
            <span>
              {selectedDate ? format(selectedDate, "MMM d") : "Date"}
            </span>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-auto p-1 rounded-2xl border border-border shadow-lg"
          >
            <div className="p-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                modifiers={{
                  hasActivity: activeDays,
                }}
                modifiersClassNames={{
                  hasActivity:
                    "font-bold underline decoration-primary decoration-2 underline-offset-4",
                }}
                captionLayout="dropdown"
                autoFocus
              />
            </div>
            {selectedDate && (
              <div className="flex justify-end border-t border-border/50 p-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSelectedDate(undefined)
                    setIsCalendarOpen(false)
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Date Filter Chip */}
      {selectedDate && (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-1.5 text-xs text-primary">
          <span>
            Filtering by <strong>{format(selectedDate, "MMMM d, yyyy")}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(undefined)}
            className="rounded p-0.5 hover:bg-primary/20"
            title="Clear date filter"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Activity Timeline List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <Sparkles className="size-8 opacity-40" />
          <p className="text-xs">
            {selectedDate
              ? `No activities recorded on ${format(selectedDate, "MMM d, yyyy")}.`
              : "No activities recorded yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredActivities.map((activity) => {
            const member = getMemberInfo(activity.user_id)
            return (
              <Item
                key={activity.id}
                variant="outline"
                className="w-full flex-col items-start gap-2 p-3"
              >
                <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{member.avatar}</span>
                    <ItemTitle className="text-xs font-semibold">
                      {member.name}
                    </ItemTitle>
                    {getTypeBadge(activity.type)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </ItemHeader>
                <ItemContent className="w-full pt-1">
                  {renderActivityBody(activity)}
                </ItemContent>
              </Item>
            )
          })}
        </div>
      )}
    </section>
  )
}

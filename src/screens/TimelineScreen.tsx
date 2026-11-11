import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { BookOpen, Heart, MessageCircle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import type {
  Activity,
  ActivityType,
  JournalActivityContent,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"

type FilterType = "all" | ActivityType

export function TimelineScreen() {
  const { activities, isLoading } = useActivities()
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterType>("all")

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true
    return activity.type === filter
  })

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
          <h4 className="text-xs font-bold text-foreground">{content.title}</h4>
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

  return (
    <section className="flex flex-col gap-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "mood", "nudge", "journal"] as const).map((tab) => (
          <Button
            key={tab}
            variant={filter === tab ? "default" : "outline"}
            size="xs"
            onClick={() => setFilter(tab)}
            className="capitalize rounded-full px-3 text-xs"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Activity Timeline List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <Sparkles className="size-8 opacity-40" />
          <p className="text-xs">No activities recorded yet.</p>
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

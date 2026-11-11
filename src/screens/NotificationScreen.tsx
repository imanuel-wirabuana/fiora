import { formatDistanceToNow } from "date-fns"
import { Bell, BookOpen, Heart, MessageCircle } from "lucide-react"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useActivities } from "@/hooks/useActivities"
import { useRelationship } from "@/hooks/useRelationship"
import type {
  JournalActivityContent,
  MoodActivityContent,
  NudgeActivityContent,
} from "@/types/activity"

export function NotificationScreen() {
  const { partnerActivities, isLoading } = useActivities()
  const { partnerMember } = useRelationship()

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  if (!partnerMember) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
        <Bell className="size-8 opacity-40" />
        <p className="text-xs">Connect with your partner to receive notifications.</p>
      </div>
    )
  }

  if (partnerActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
        <Bell className="size-8 opacity-40" />
        <p className="text-xs">No updates from {partnerName} yet.</p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-2.5">
      {partnerActivities.map((activity) => {
        let title = ""
        let description = ""
        let icon = null

        if (activity.type === "mood") {
          const content = activity.content as MoodActivityContent | null
          title = `${partnerName} updated mood: ${content?.emoji || ""} ${content?.label || ""}`
          description = content?.note ? `"${content.note}"` : "Checked in their mood"
          icon = <Heart className="size-3.5 text-rose-500 fill-rose-500" />
        } else if (activity.type === "nudge") {
          const content = activity.content as NudgeActivityContent | null
          title = `${partnerName} sent you a nudge!`
          description = `${content?.emoji || "💌"} "${content?.label || ""}"`
          icon = <MessageCircle className="size-3.5 text-amber-500" />
        } else if (activity.type === "journal") {
          const content = activity.content as JournalActivityContent | null
          title = `${partnerName} added a new journal entry`
          description = content?.title || "Shared a memory"
          icon = <BookOpen className="size-3.5 text-blue-500" />
        }

        return (
          <Item
            key={activity.id}
            variant="outline"
            className="w-full flex-col items-start gap-1.5 p-3 rounded-2xl"
          >
            <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{partnerAvatar}</span>
                <div className="flex items-center gap-1.5">
                  {icon}
                  <ItemTitle className="text-xs font-semibold">{title}</ItemTitle>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </span>
            </ItemHeader>
            <ItemContent className="pl-6 text-xs text-muted-foreground">
              {description}
            </ItemContent>
          </Item>
        )
      })}
    </section>
  )
}

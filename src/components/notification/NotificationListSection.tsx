import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  BellRing,
  BookOpen,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { useLocation } from "wouter"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/hooks/useNotifications"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useRelationship } from "@/hooks/useRelationship"

export function NotificationListSection() {
  const [, navigate] = useLocation()
  const { notifications, isLoading, markAsRead } = useNotifications()
  const {
    isSupported,
    isIOS,
    isStandalone,
    permission,
    isSubscribed,
    isPending,
    enablePush,
  } = usePushNotifications()
  const { partnerMember } = useRelationship()

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"

  const showEnablePrompt =
    isSupported &&
    !(isIOS && !isStandalone) &&
    !isSubscribed &&
    permission !== "denied"

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  if (!partnerMember) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <Bell className="size-8 opacity-40" />
        <p className="text-xs">
          Connect with your partner to receive notifications.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {showEnablePrompt && (
        <CustomItem
          className="rounded-2xl border-primary/20 bg-primary/5 p-3"
          icon={<BellRing className="size-4 text-primary" />}
          title="Get alerts when the app is closed"
          description="Enable phone notifications so you never miss a nudge or mood update."
          topRightActions={
            <Button
              size="sm"
              className="h-7 rounded-xl px-2.5 text-[11px]"
              disabled={isPending}
              onClick={() => {
                void enablePush().catch(() => {
                  // Handled in settings
                })
              }}
            >
              {isPending ? <Spinner className="size-3" /> : "Enable"}
            </Button>
          }
        />
      )}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Bell className="size-8 opacity-40" />
          <p className="text-xs">No updates from {partnerName} yet.</p>
        </div>
      ) : (
        notifications.map((item) => {
          const content = item.content
          if (!content) return null

          let icon = <Bell className="size-3.5 text-primary" />
          if (content.type === "mood") {
            icon = <Heart className="size-3.5 fill-rose-500 text-rose-500" />
          } else if (content.type === "nudge") {
            icon = <MessageCircle className="size-3.5 text-amber-500" />
          } else if (content.type === "journal") {
            icon = <BookOpen className="size-3.5 text-blue-500" />
          } else if (content.type === "quiz") {
            icon = <Sparkles className="size-3.5 text-violet-500" />
          }

          const isUnread = !content.isRead

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                void markAsRead(item)
                if (content.url) {
                  navigate(content.url)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  void markAsRead(item)
                  if (content.url) {
                    navigate(content.url)
                  }
                }
              }}
              className="cursor-pointer text-left"
            >
              <CustomItem
                className={`gap-1.5 rounded-2xl p-3 transition ${
                  isUnread ? "border-primary/30 bg-primary/5" : ""
                }`}
                icon={
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">
                      {partnerAvatar}
                    </span>
                    {icon}
                  </div>
                }
                title={content.title}
                topRightActions={
                  <div className="flex items-center gap-1.5">
                    {isUnread && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                }
                description={content.body}
                descriptionClassName="pl-6"
              />
            </div>
          )
        })
      )}
    </div>
  )
}

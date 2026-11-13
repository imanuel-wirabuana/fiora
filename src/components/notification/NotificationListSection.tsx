import { useEffect, useMemo, useState } from "react"
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns"
import {
  Bell,
  BellRing,
  BookOpen,
  Heart,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useLocation } from "wouter"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/hooks/useNotifications"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useRelationship } from "@/hooks/useRelationship"
import type {
  NotificationRecord,
  NotificationType,
} from "@/types/notification"

type NotificationFilter = "all" | NotificationType

const FILTER_OPTIONS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mood", label: "Mood" },
  { value: "nudge", label: "Nudge" },
  { value: "journal", label: "Journal" },
  { value: "quiz", label: "Quiz" },
]

function getTypeIcon(type?: string | null) {
  switch (type) {
    case "mood":
      return <Heart className="size-4 fill-rose-500 text-rose-500" />
    case "nudge":
      return <Send className="size-4 text-amber-500" />
    case "journal":
      return <BookOpen className="size-4 text-blue-500" />
    case "quiz":
      return <Sparkles className="size-4 text-violet-500" />
    default:
      return <Bell className="size-4 text-muted-foreground" />
  }
}

function formatNotificationTime(dateStr?: string | null) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const exactTime = format(date, "h:mm a")
  if (isToday(date)) {
    return `${exactTime} · ${formatDistanceToNow(date, { addSuffix: true })}`
  }
  return `${format(date, "MMM d")} · ${exactTime}`
}

export function NotificationListSection() {
  const [, navigate] = useLocation()
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [clearDrawerOpen, setClearDrawerOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    isClearing,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications()
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

  // Automatically mark all unread notifications as read when opening or receiving while open
  useEffect(() => {
    if (isLoading || unreadCount === 0) return
    void markAllAsRead()
  }, [isLoading, unreadCount, markAllAsRead])

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications
    return notifications.filter((item) => item.content?.type === filter)
  }, [notifications, filter])

  const groupedSections = useMemo(() => {
    const todayItems: NotificationRecord[] = []
    const yesterdayItems: NotificationRecord[] = []
    const earlierItems: NotificationRecord[] = []

    for (const item of filteredNotifications) {
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
  }, [filteredNotifications])

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
    <div className="flex flex-col gap-3">
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

      {/* Filter Pills & Clear All */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={filter === option.value ? "default" : "outline"}
                size="xs"
                onClick={() => setFilter(option.value)}
                className="h-7 rounded-full px-3 text-[11px]"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={isClearing}
            onClick={() => setClearDrawerOpen(true)}
            className="h-7 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
          >
            {isClearing ? (
              <Spinner className="size-3" />
            ) : (
              <Trash2 className="size-3" />
            )}
            Clear
          </Button>
        </div>
      )}

      {/* Empty State or Grouped Feed */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Bell className="size-8 opacity-40" />
          <p className="text-[11px]">
            {filter === "all"
              ? `No updates from ${partnerName} yet.`
              : `No ${filter} notifications yet.`}
          </p>
        </div>
      ) : (
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
                {group.items.map((item) => {
                  const content = item.content
                  if (!content) return null

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (content.url) {
                          navigate(content.url)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          if (content.url) {
                            navigate(content.url)
                          }
                        }
                      }}
                      className="cursor-pointer text-left"
                    >
                      <CustomItem
                        className="gap-1.5 rounded-2xl p-3 transition-colors hover:bg-muted/30"
                        icon={getTypeIcon(content.type)}
                        title={`${partnerAvatar} ${content.title || "Notification"}`}
                        description={content.body || undefined}
                        topRightActions={
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                              {formatNotificationTime(item.created_at)}
                            </span>
                            <button
                              type="button"
                              aria-label="Dismiss notification"
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteNotification(item.id)
                              }}
                              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        }
                        contentClassName="pl-6"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormDrawer
        open={clearDrawerOpen}
        onOpenChange={setClearDrawerOpen}
        title="Clear all notifications?"
        description="This will permanently remove all notifications from your feed."
        submitLabel="Clear All"
        successLabel="Cleared!"
        isPending={isClearing}
        onSubmit={async () => {
          await clearAllNotifications()
        }}
      />
    </div>
  )
}

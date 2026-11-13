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
  MessageCircle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useLocation } from "wouter"
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useNotifications } from "@/hooks/useNotifications"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
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

function getTypeMeta(type?: string | null) {
  switch (type) {
    case "mood":
      return {
        label: "Mood",
        icon: <Heart className="size-2.5 fill-rose-500 text-rose-500" />,
        badgeClass:
          "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      }
    case "nudge":
      return {
        label: "Nudge",
        icon: <MessageCircle className="size-2.5 text-amber-500" />,
        badgeClass:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      }
    case "journal":
      return {
        label: "Journal",
        icon: <BookOpen className="size-2.5 text-blue-500" />,
        badgeClass:
          "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      }
    case "quiz":
      return {
        label: "Quiz",
        icon: <Sparkles className="size-2.5 text-violet-500" />,
        badgeClass:
          "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
      }
    default:
      return {
        label:
          typeof type === "string" && type.trim().length > 0
            ? type.charAt(0).toUpperCase() + type.slice(1)
            : "Notification",
        icon: <Bell className="size-2.5 text-muted-foreground" />,
        badgeClass:
          "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
      }
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
                className="h-7 rounded-full px-3 text-xs"
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
            onClick={() => {
              void clearAllNotifications()
            }}
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
          <p className="text-xs">
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
                  const meta = getTypeMeta(content.type)

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
                        icon={
                          <span className="text-base leading-none">
                            {partnerAvatar}
                          </span>
                        }
                        title={content.title || "Notification"}
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
                        contentClassName="space-y-1.5 pl-6"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 gap-1 px-1.5 py-0 text-[10px] font-normal",
                              meta.badgeClass
                            )}
                          >
                            {meta.icon}
                            {meta.label}
                          </Badge>
                          {content.body && (
                            <p className="text-xs leading-snug text-muted-foreground">
                              {content.body}
                            </p>
                          )}
                        </div>
                      </CustomItem>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

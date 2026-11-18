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
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useLocation } from "wouter"
import { useTranslation } from "react-i18next"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { Spinner } from "@/components/ui/spinner"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useNotifications } from "@/hooks/useNotifications"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useRelationship } from "@/hooks/useRelationship"
import { getDateFnsLocale } from "@/lib/i18n"
import type {
  NotificationCategory,
  NotificationRecord,
} from "@/types/notification"

type NotificationFilter = "all" | NotificationCategory

const PRIMARY_NOTIFICATION_TYPES = new Set<string>([
  "mood",
  "nudge",
  "chat",
  "quiz",
])

function getNotificationCategory(type?: string | null): NotificationCategory {
  if (type && PRIMARY_NOTIFICATION_TYPES.has(type)) {
    return type as NotificationCategory
  }
  return "other"
}

function getTypeIcon(type?: string | null) {
  switch (getNotificationCategory(type)) {
    case "chat":
      return <MessageCircle className="size-4 text-primary" />
    case "mood":
      return <Heart className="size-4 fill-primary text-primary" />
    case "nudge":
      return <Send className="size-4 text-amber-500" />
    case "quiz":
      return <Sparkles className="size-4 text-violet-500" />
    default:
      return <Bell className="size-4 text-muted-foreground" />
  }
}

function formatNotificationTime(dateStr?: string | null, language?: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const locale = getDateFnsLocale(language)
  const exactTime = format(date, "h:mm a", { locale })
  if (isToday(date)) {
    return `${exactTime} · ${formatDistanceToNow(date, { addSuffix: true, locale })}`
  }
  return `${format(date, "MMM d", { locale })} · ${exactTime}`
}

export function NotificationListSection() {
  const { t, i18n } = useTranslation("notification")
  const [, navigate] = useLocation()
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [clearDrawerOpen, setClearDrawerOpen] = useState(false)
  const [justReadIds, setJustReadIds] = useState<Set<number>>(() => new Set())
  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isClearing,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications()
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      void fetchNextPage()
    },
  })
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

  const partnerName = partnerMember?.content?.name || t("partner")
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"

  const filterOptions = useMemo<{ value: NotificationFilter; label: string }[]>(
    () => [
      { value: "all", label: t("filters.all") },
      { value: "mood", label: t("filters.mood") },
      { value: "nudge", label: t("filters.nudge") },
      { value: "chat", label: t("filters.chat") },
      { value: "quiz", label: t("filters.quiz") },
      { value: "other", label: t("filters.other") },
    ],
    [t]
  )

  // Capture unread IDs for this visit before auto-marking all as read
  useEffect(() => {
    if (isLoading || unreadCount === 0) return

    const unreadIds = notifications
      .filter((item) => item.content && !item.content.isRead)
      .map((item) => item.id)

    if (unreadIds.length > 0) {
      setJustReadIds((prev) => {
        const next = new Set(prev)
        let changed = false
        for (const id of unreadIds) {
          if (!next.has(id)) {
            next.add(id)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }

    void markAllAsRead()
  }, [isLoading, unreadCount, notifications, markAllAsRead])

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications
    return notifications.filter(
      (item) => getNotificationCategory(item.content?.type) === filter
    )
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
      { label: t("groups.today"), items: todayItems },
      { label: t("groups.yesterday"), items: yesterdayItems },
      { label: t("groups.earlier"), items: earlierItems },
    ].filter((group) => group.items.length > 0)
  }, [filteredNotifications, t])

  const showEnablePrompt =
    isSupported &&
    !(isIOS && !isStandalone) &&
    !isSubscribed &&
    permission !== "denied"

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          <CustomSkeleton className="h-7 w-12 rounded-full" />
          <CustomSkeleton className="h-7 w-16 rounded-full" />
          <CustomSkeleton className="h-7 w-16 rounded-full" />
          <CustomSkeleton className="h-7 w-16 rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, idx) => (
          <CustomSkeleton key={idx} className="h-18 w-full" />
        ))}
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
          title={t("enablePrompt.title")}
          description={t("enablePrompt.description")}
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
              {isPending ? (
                <Spinner className="size-3" />
              ) : (
                t("enablePrompt.button")
              )}
            </Button>
          }
        />
      )}

      {/* Filter Pills & Clear All */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto">
            {filterOptions.map((option) => (
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
            {t("clear")}
          </Button>
        </div>
      )}

      {/* Empty State or Grouped Feed */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Bell className="size-8 opacity-40" />
          <p className="text-[11px]">
            {filter === "all"
              ? t("emptyAll", { name: partnerName })
              : t("emptyFiltered", {
                  filter: t(`filters.${filter}`).toLowerCase(),
                })}
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

                  const isJustRead = !content.isRead || justReadIds.has(item.id)

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
                        variant={isJustRead ? "soft" : "default"}
                        className={
                          isJustRead
                            ? "gap-1.5 rounded-2xl p-3 transition-colors hover:bg-primary/15"
                            : "gap-1.5 rounded-2xl p-3 transition-colors hover:bg-muted/30"
                        }
                        icon={getTypeIcon(content.type)}
                        title={`${partnerAvatar} ${content.title || t("notificationFallback")}`}
                        description={content.body || undefined}
                        topRightActions={
                          <div className="flex items-center gap-1.5">
                            {isJustRead && (
                              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                                {t("newBadge")}
                              </span>
                            )}
                            <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                              {formatNotificationTime(
                                item.created_at,
                                i18n.language
                              )}
                            </span>
                            <button
                              type="button"
                              aria-label={t("dismissAria")}
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

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex flex-col gap-2">
              <CustomSkeleton className="h-18 w-full" />
              <CustomSkeleton className="h-18 w-full" />
            </div>
          )}
        </div>
      )}

      <FormDrawer
        open={clearDrawerOpen}
        onOpenChange={setClearDrawerOpen}
        title={t("clearDrawer.title")}
        description={t("clearDrawer.description")}
        submitLabel={t("clearDrawer.submit")}
        successLabel={t("clearDrawer.success")}
        isPending={isClearing}
        onSubmit={async () => {
          await clearAllNotifications()
        }}
      />
    </div>
  )
}

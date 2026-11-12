import { useEffect, useState } from "react"
import { format, formatDistanceToNow, isToday } from "date-fns"
import {
  Activity,
  Bell,
  BookOpen,
  Clock,
  Home,
  MapPin,
  Moon,
  Settings,
  Smile,
  Sparkles,
  UserPlus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Item, ItemContent } from "@/components/ui/item"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { cn } from "@/lib/utils"

function ActivityIcon({
  activity,
  className,
}: {
  activity: string | null
  className?: string
}) {
  switch (activity) {
    case "Viewing Home":
      return <Home className={className} />
    case "Viewing Timeline":
      return <Clock className={className} />
    case "Reading Journal":
      return <BookOpen className={className} />
    case "In Settings":
      return <Settings className={className} />
    case "Checking Notifications":
      return <Bell className={className} />
    case "Viewing Location Map":
      return <MapPin className={className} />
    case "Reviewing Daily Quiz":
      return <Sparkles className={className} />
    case "Logging a Mood":
      return <Smile className={className} />
    case "In the background":
      return <Moon className={className} />
    default:
      return <Activity className={className} />
  }
}

function formatLastOnline(dateStr: string): string {
  const date = new Date(dateStr)
  const relative = formatDistanceToNow(date, { addSuffix: true })
  const exactTime = format(date, "h:mm a")
  if (isToday(date)) {
    return `${relative} · Today at ${exactTime}`
  }
  return `${relative} · ${format(date, "MMM d")} at ${exactTime}`
}

export function PartnerPresenceSection() {
  const {
    isOnline,
    isBackground,
    currentActivity,
    lastSeenAt,
    partnerMember,
  } = usePartnerPresence()

  // Refresh relative timestamps every 30s while viewing Home
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  if (!partnerMember) {
    return (
      <Item variant="outline" className="w-full items-center gap-3 p-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <UserPlus className="size-4.5" />
        </div>
        <ItemContent className="min-w-0 gap-0.5">
          <span className="text-xs font-semibold text-foreground">
            Waiting for partner
          </span>
          <span className="text-[11px] text-muted-foreground">
            Share your invite code in Settings to connect
          </span>
        </ItemContent>
      </Item>
    )
  }

  const partnerName = partnerMember.content?.name || "Partner"
  const partnerAvatar = partnerMember.content?.avatar || "🤍"

  const statusLabel = isOnline
    ? isBackground
      ? "Away"
      : "Online"
    : "Offline"

  return (
    <Item variant="outline" className="w-full items-center gap-3 p-3.5">
      {/* Partner Avatar + Live Status Dot */}
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-lg ring-1 ring-border">
        <span className="leading-none select-none">{partnerAvatar}</span>
        <span
          className={cn(
            "absolute right-0 bottom-0 flex size-3 items-center justify-center rounded-full ring-2 ring-background",
            isOnline
              ? isBackground
                ? "bg-amber-500"
                : "bg-emerald-500"
              : "bg-muted-foreground/40"
          )}
          aria-label={statusLabel}
        >
          {isOnline && !isBackground ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          ) : null}
        </span>
      </div>

      {/* Name, Status, Activity & Last Online */}
      <ItemContent className="min-w-0 gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold capitalize text-foreground">
              {partnerName}
            </span>
            <Badge
              variant={isOnline ? "secondary" : "outline"}
              className={cn(
                "h-4.5 px-1.5 text-[10px] font-medium",
                isOnline && !isBackground
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : isOnline && isBackground
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "text-muted-foreground"
              )}
            >
              {statusLabel}
            </Badge>
          </div>

          {isOnline ? (
            <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {isBackground ? "Idle" : "Active now"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {/* Current Activity */}
          {isOnline && currentActivity ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
              <ActivityIcon
                activity={currentActivity}
                className="size-3 shrink-0 text-primary"
              />
              <span className="truncate">{currentActivity}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0 opacity-70" />
              <span>
                {lastSeenAt
                  ? `Last online ${formatLastOnline(lastSeenAt)}`
                  : "Not seen online yet"}
              </span>
            </span>
          )}

          {/* Subtle last activity when offline */}
          {!isOnline && currentActivity ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/80">
              <span>·</span>
              <ActivityIcon
                activity={currentActivity}
                className="size-2.5 shrink-0"
              />
              <span className="truncate">Last: {currentActivity}</span>
            </span>
          ) : null}
        </div>
      </ItemContent>
    </Item>
  )
}


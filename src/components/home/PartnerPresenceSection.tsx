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
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
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
  const { isOnline, isBackground, currentActivity, lastSeenAt, partnerMember } =
    usePartnerPresence()

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
      <CustomItem
        variant="fill"
        className="gap-1.5"
        icon={
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground">
            <UserPlus className="size-4" />
          </div>
        }
        title="Waiting for partner"
        description="Share your invite code in Settings to connect"
        descriptionClassName="text-[11px]"
      />
    )
  }

  const partnerName = partnerMember.content?.name || "Partner"
  const partnerAvatar = partnerMember.content?.avatar || "🤍"

  const statusLabel = isOnline ? (isBackground ? "Away" : "Online") : "Offline"

  return (
    <CustomItem
      variant="fill"
      className="gap-2"
      icon={
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-base ring-1 ring-primary-foreground/25">
          <span className="leading-none select-none">{partnerAvatar}</span>
          <span
            className={cn(
              "absolute right-0 bottom-0 flex size-2.5 items-center justify-center rounded-full ring-2 ring-primary",
              isOnline
                ? isBackground
                  ? "bg-amber-400"
                  : "bg-emerald-400"
                : "bg-primary-foreground/45"
            )}
            aria-label={statusLabel}
          >
            {isOnline && !isBackground ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            ) : null}
          </span>
        </div>
      }
      title={partnerName}
      topRightActions={
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "h-4.5 shrink-0 px-1.5 text-[10px] font-medium",
              isOnline && !isBackground
                ? "border-emerald-300/30 bg-emerald-400/25 text-white"
                : isOnline && isBackground
                  ? "border-amber-300/30 bg-amber-400/25 text-white"
                  : "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground/85"
            )}
          >
            {statusLabel}
          </Badge>
          {isOnline ? (
            <span className="shrink-0 text-[10px] font-medium text-primary-foreground/90">
              {isBackground ? "Idle" : "Active now"}
            </span>
          ) : null}
        </div>
      }
      bottomLeftInfo={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-primary-foreground/80">
          {/* Current Activity */}
          {isOnline && currentActivity ? (
            <span className="inline-flex items-center gap-1 font-medium text-primary-foreground">
              <ActivityIcon
                activity={currentActivity}
                className="size-3 shrink-0 text-primary-foreground/90"
              />
              <span className="truncate">{currentActivity}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0 opacity-80" />
              <span>
                {lastSeenAt
                  ? `Last online ${formatLastOnline(lastSeenAt)}`
                  : "Not seen online yet"}
              </span>
            </span>
          )}
        </div>
      }
    />
  )
}

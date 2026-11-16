import { useEffect, useState } from "react"
import {
  differenceInCalendarDays,
  formatDistanceToNow,
  parseISO,
} from "date-fns"
import { MapPin, UserPlus } from "lucide-react"
import { useLocation } from "wouter"
import { CustomItem } from "@/components/CustomItem"
import { OdometerText } from "@/components/OdometerText"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { cn } from "@/lib/utils"

export function PartnerPresenceSection() {
  const [, setLocation] = useLocation()
  const {
    isOnline,
    currentActivity,
    lastSeenAt,
    anniversary,
    partnerLocation,
    locationSharing,
    partnerMember,
    partnerName,
    partnerAlias,
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
      <CustomItem
        variant="solid"
        className="gap-1.5 bg-transparent"
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

  const partnerAvatar = partnerMember.content?.avatar || "🤍"
  const statusLabel = isOnline ? "Online" : "Offline"

  const lastSeenText = lastSeenAt
    ? `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
    : "Not seen yet"

  const activityText = currentActivity
    ? isOnline
      ? currentActivity
      : `Last active: ${currentActivity}`
    : undefined

  const locationLabel = partnerLocation
    ? partnerLocation.placeName?.trim() || "Location shared"
    : null

  const locationUpdatedText = partnerLocation?.updated_at
    ? formatDistanceToNow(new Date(partnerLocation.updated_at), {
        addSuffix: true,
      })
    : null

  const daysTogether = (() => {
    if (!anniversary) return null
    const parsed = parseISO(anniversary)
    if (Number.isNaN(parsed.getTime())) return null
    const diff = differenceInCalendarDays(new Date(), parsed)
    return diff >= 0 ? diff : null
  })()

  const locationContent = locationLabel ? (
    <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-primary-foreground/85">
      <MapPin className="size-3 shrink-0 text-primary-foreground/75" />
      <span className="truncate">{locationLabel}</span>
      {locationUpdatedText ? (
        <span className="shrink-0 text-primary-foreground/65">
          · {locationUpdatedText}
        </span>
      ) : null}
    </span>
  ) : null

  return (
    <CustomItem
      variant="solid"
      className="gap-2 bg-transparent"
      icon={
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-base ring-1 ring-primary-foreground/25">
          <span className="leading-none select-none">{partnerAvatar}</span>
          <span
            className={cn(
              "absolute right-0 bottom-0 flex size-2.5 items-center justify-center rounded-full ring-2 ring-primary",
              isOnline ? "bg-emerald-400" : "bg-primary-foreground/45"
            )}
            aria-label={statusLabel}
          >
            {isOnline ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            ) : null}
          </span>
        </div>
      }
      title={<OdometerText items={[partnerName, partnerAlias]} />}
      description={activityText}
      topRightActions={
        isOnline ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-medium text-emerald-100 ring-1 ring-emerald-300/30">
            <span className="size-1.5 rounded-full bg-emerald-300" />
            Online
          </span>
        ) : (
          <span className="shrink-0 text-[11px] font-medium text-primary-foreground/80">
            {lastSeenText}
          </span>
        )
      }
      bottomLeftInfo={
        locationContent ? (
          locationSharing ? (
            <button
              type="button"
              onClick={() => setLocation("/location")}
              className="flex min-w-0 items-center text-left transition-opacity hover:opacity-80"
            >
              {locationContent}
            </button>
          ) : (
            locationContent
          )
        ) : undefined
      }
      bottomRightActions={
        daysTogether !== null ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground ring-1 ring-primary-foreground/20">
            {daysTogether} {daysTogether === 1 ? "day" : "days"} together
          </span>
        ) : undefined
      }
    />
  )
}

import { useEffect, useState } from "react"
import {
  differenceInCalendarDays,
  formatDistanceToNow,
  parseISO,
} from "date-fns"
import { MapPin, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "wouter"
import { useTabPaneActive } from "@/components/AnimationScopeContext"
import { CustomItem } from "@/components/CustomItem"
import { OdometerText } from "@/components/OdometerText"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { getDateFnsLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useIsAnimationsPaused } from "@/stores/animationStore"

export function PartnerPresenceSection() {
  const { t, i18n } = useTranslation("home")
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

  const isPaneActive = useTabPaneActive()
  const isAnimationsPaused = useIsAnimationsPaused()
  const isPaused = !isPaneActive || isAnimationsPaused

  // Refresh relative timestamps every 30s while viewing Home
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isPaneActive) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [isPaneActive])

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
        title={t("presence.waitingPartner")}
        description={t("presence.shareInviteCode")}
        descriptionClassName="text-[11px]"
      />
    )
  }

  const locale = getDateFnsLocale(i18n.language)
  const partnerAvatar = partnerMember.content?.avatar || "🤍"
  const statusLabel = isOnline ? t("presence.online") : t("presence.offline")

  const lastSeenText = lastSeenAt
    ? t("presence.lastSeen", {
        time: formatDistanceToNow(new Date(lastSeenAt), {
          addSuffix: true,
          locale,
        }),
      })
    : t("presence.notSeenYet")

  const activityText = currentActivity
    ? isOnline
      ? currentActivity
      : t("presence.lastActive", { activity: currentActivity })
    : undefined

  const locationLabel = partnerLocation
    ? partnerLocation.placeName?.trim() || t("presence.locationShared")
    : null

  const locationUpdatedText = partnerLocation?.updated_at
    ? formatDistanceToNow(new Date(partnerLocation.updated_at), {
        addSuffix: true,
        locale,
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
              <span
                className={cn(
                  "absolute inline-flex size-full rounded-full bg-emerald-300 opacity-75",
                  !isPaused && "animate-ping"
                )}
              />
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
            {t("presence.online")}
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
            {t("presence.daysTogether", { count: daysTogether })}
          </span>
        ) : undefined
      }
    />
  )
}

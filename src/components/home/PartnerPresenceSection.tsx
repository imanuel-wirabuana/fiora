import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { UserPlus } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { cn } from "@/lib/utils"

export function PartnerPresenceSection() {
  const { isOnline, isBackground, lastSeenAt, partnerMember } =
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
        variant="solid"
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

  const lastSeenText = lastSeenAt
    ? `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
    : "Not seen yet"

  return (
    <CustomItem
      variant="solid"
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
        <span className="shrink-0 text-[11px] font-medium text-primary-foreground/80">
          {lastSeenText}
        </span>
      }
    />
  )
}

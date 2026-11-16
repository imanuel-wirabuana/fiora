import { MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  isPartnerTyping: boolean
}

function isImageUrl(value?: string): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  )
}

export function ChatHeader({ isPartnerTyping }: ChatHeaderProps) {
  const { isOnline, currentActivity, partnerMember, partnerName } =
    usePartnerPresence()

  const avatarValue = partnerMember?.content?.avatar
  const hasImageAvatar = isImageUrl(avatarValue)

  const presenceLabel = isPartnerTyping
    ? "Typing..."
    : isOnline
      ? "Online"
      : partnerMember
        ? "Offline"
        : "Waiting"

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-3.5 py-1.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-7 shrink-0">
          {hasImageAvatar ? (
            <AvatarImage src={avatarValue} alt={partnerName} />
          ) : null}
          <AvatarFallback className="text-xs">
            {avatarValue && !hasImageAvatar ? (
              avatarValue
            ) : (
              <MessageCircle className="size-3.5 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-semibold leading-tight">
            {partnerMember ? partnerName : "Partner Chat"}
          </span>
          {isOnline && currentActivity ? (
            <span className="truncate text-[10px] leading-tight text-muted-foreground">
              {currentActivity}
            </span>
          ) : null}
        </div>
      </div>

      <Badge
        variant={isPartnerTyping ? "default" : "secondary"}
        className="h-5 shrink-0 gap-1.5 px-2 py-0 text-[10px] font-medium"
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            isPartnerTyping
              ? "animate-pulse bg-primary-foreground"
              : isOnline
                ? "bg-primary"
                : "bg-muted-foreground/50"
          )}
        />
        <span>{presenceLabel}</span>
      </Badge>
    </div>
  )
}

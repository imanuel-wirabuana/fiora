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
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")
}

export function ChatHeader({ isPartnerTyping }: ChatHeaderProps) {
  const { isOnline, currentActivity, partnerMember, partnerName } =
    usePartnerPresence()

  const avatarValue = partnerMember?.content?.avatar
  const hasImageAvatar = isImageUrl(avatarValue)

  const statusText = isPartnerTyping
    ? "Typing..."
    : isOnline
      ? currentActivity || "Online"
      : partnerMember
        ? "Offline"
        : "Waiting for partner"

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="size-9">
            {hasImageAvatar ? (
              <AvatarImage src={avatarValue} alt={partnerName} />
            ) : null}
            <AvatarFallback className="text-base">
              {avatarValue && !hasImageAvatar ? (
                avatarValue
              ) : (
                <MessageCircle className="size-4 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
          {partnerMember ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-background",
                isOnline ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">
            {partnerMember ? partnerName : "Partner Chat"}
          </span>
          <span
            className={cn(
              "truncate text-xs leading-tight",
              isPartnerTyping ? "font-medium text-primary" : "text-muted-foreground"
            )}
          >
            {statusText}
          </span>
        </div>
      </div>

      {isPartnerTyping ? (
        <Badge variant="secondary" className="shrink-0 text-[11px]">
          Typing
        </Badge>
      ) : null}
    </div>
  )
}

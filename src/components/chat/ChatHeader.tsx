import { formatDistanceToNow } from "date-fns"
import { MessageCircle, Search, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  isPartnerTyping: boolean
  isSearchOpen: boolean
  searchQuery: string
  onToggleSearch: () => void
  onSearchQueryChange: (value: string) => void
}

function isImageUrl(value?: string): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  )
}

export function ChatHeader({
  isPartnerTyping,
  isSearchOpen,
  searchQuery,
  onToggleSearch,
  onSearchQueryChange,
}: ChatHeaderProps) {
  const { isOnline, currentActivity, lastSeenAt, partnerMember, partnerName } =
    usePartnerPresence()

  const avatarValue = partnerMember?.content?.avatar
  const hasImageAvatar = isImageUrl(avatarValue)

  const statusText = isPartnerTyping
    ? "Typing..."
    : isOnline
      ? currentActivity
        ? `Online · ${currentActivity}`
        : "Online"
      : partnerMember
        ? lastSeenAt
          ? `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
          : "Offline"
        : "Waiting for partner"

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      {isSearchOpen ? (
        <div className="pointer-events-auto flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-2xl border border-border/60 bg-background/90 px-2.5 shadow-lg backdrop-blur-md">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            aria-label="Search messages"
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onSearchQueryChange("")}
              aria-label="Clear search query"
            >
              <X data-icon />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="pointer-events-auto flex h-9 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-2 shadow-lg backdrop-blur-md">
          <Avatar className="size-6 shrink-0">
            {hasImageAvatar ? (
              <AvatarImage src={avatarValue} alt={partnerName} />
            ) : null}
            <AvatarFallback className="text-[11px]">
              {avatarValue && !hasImageAvatar ? (
                avatarValue
              ) : (
                <MessageCircle className="size-3 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className="truncate text-[11px] font-semibold leading-none">
              {partnerMember ? partnerName : "Partner Chat"}
            </span>
            <div className="flex min-w-0 items-center gap-1">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  isPartnerTyping
                    ? "animate-pulse bg-primary"
                    : isOnline
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/50"
                )}
              />
              <span
                className={cn(
                  "truncate text-[10px] leading-none",
                  isPartnerTyping
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                {statusText}
              </span>
            </div>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onToggleSearch}
        aria-label={isSearchOpen ? "Close search" : "Search messages"}
        className="pointer-events-auto size-9 shrink-0 rounded-full border-border/60 bg-background/90 shadow-lg backdrop-blur-md hover:bg-background"
      >
        {isSearchOpen ? (
          <X className="size-3.5" />
        ) : (
          <Search className="size-3.5" />
        )}
      </Button>
    </header>
  )
}

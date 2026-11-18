import { formatDistanceToNow } from "date-fns"
import { useTranslation } from "react-i18next"
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Pencil,
  Reply,
  Search,
  Trash,
  Undo2,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { getDateFnsLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const HEADER_ACTION_BUTTON_CLASS =
  "pointer-events-auto size-9 shrink-0 rounded-full border-border/60 bg-background/90 shadow-lg backdrop-blur-md hover:bg-background"

interface ChatHeaderProps {
  isPartnerTyping: boolean
  isSearchOpen: boolean
  searchQuery: string
  searchMatchCount: number
  activeSearchIndex: number
  onToggleSearch: () => void
  onSearchQueryChange: (value: string) => void
  onPrevSearchMatch: () => void
  onNextSearchMatch: () => void
  isSelectionMode: boolean
  selectedCount: number
  canEditSelected: boolean
  canUnsendSelected: boolean
  onClearSelection: () => void
  onReplySelected: () => void
  onEditSelected: () => void
  onDeleteSelected: () => void
  onUnsendSelected: () => void
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
  searchMatchCount,
  activeSearchIndex,
  onToggleSearch,
  onSearchQueryChange,
  onPrevSearchMatch,
  onNextSearchMatch,
  isSelectionMode,
  selectedCount,
  canEditSelected,
  canUnsendSelected,
  onClearSelection,
  onReplySelected,
  onEditSelected,
  onDeleteSelected,
  onUnsendSelected,
}: ChatHeaderProps) {
  const { t, i18n } = useTranslation("chat")
  const { isOnline, currentActivity, lastSeenAt, partnerMember, partnerName } =
    usePartnerPresence()

  const avatarValue = partnerMember?.content?.avatar
  const hasImageAvatar = isImageUrl(avatarValue)

  const statusText = isSelectionMode
    ? t("header.selected", { count: selectedCount })
    : isPartnerTyping
      ? t("header.typing")
      : isOnline
        ? currentActivity
          ? t("header.onlineActivity", { activity: currentActivity })
          : t("header.online")
        : partnerMember
          ? lastSeenAt
            ? t("header.lastSeen", {
                time: formatDistanceToNow(new Date(lastSeenAt), {
                  addSuffix: true,
                  locale: getDateFnsLocale(i18n.language),
                }),
              })
            : t("header.offline")
          : t("header.waitingPartner")

  const hasQuery = searchQuery.trim().length > 0

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      {!isSelectionMode && isSearchOpen ? (
        <div className="pointer-events-auto flex h-9 min-w-0 flex-1 items-center gap-1 rounded-2xl border border-border/60 bg-background/90 px-2.5 shadow-lg backdrop-blur-md">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (e.shiftKey) {
                  onPrevSearchMatch()
                } else {
                  onNextSearchMatch()
                }
              }
            }}
            placeholder={t("header.searchPlaceholder")}
            autoFocus
            aria-label={t("header.searchAria")}
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {hasQuery ? (
            <>
              <span className="shrink-0 px-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                {searchMatchCount > 0
                  ? `${activeSearchIndex + 1}/${searchMatchCount}`
                  : "0/0"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={searchMatchCount === 0}
                onClick={onPrevSearchMatch}
                aria-label={t("header.prevMatchAria")}
              >
                <ChevronUp data-icon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={searchMatchCount === 0}
                onClick={onNextSearchMatch}
                aria-label={t("header.nextMatchAria")}
              >
                <ChevronDown data-icon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onSearchQueryChange("")}
                aria-label={t("header.clearSearchAria")}
              >
                <X data-icon />
              </Button>
            </>
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
              {!isSelectionMode ? (
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
              ) : null}
              <span
                className={cn(
                  "truncate text-[10px] leading-none",
                  isSelectionMode || isPartnerTyping
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

      {isSelectionMode ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {selectedCount === 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onReplySelected}
              aria-label={t("header.replyAria")}
              title={t("header.replyTitle")}
              className={HEADER_ACTION_BUTTON_CLASS}
            >
              <Reply className="size-3.5" />
            </Button>
          ) : null}

          {selectedCount === 1 && canEditSelected ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onEditSelected}
              aria-label={t("header.editAria")}
              title={t("header.editTitle")}
              className={HEADER_ACTION_BUTTON_CLASS}
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={selectedCount === 0}
            onClick={onDeleteSelected}
            aria-label={
              selectedCount > 1
                ? t("header.deleteSelectedAria")
                : t("header.deleteAria")
            }
            title={t("header.deleteTitle")}
            className={HEADER_ACTION_BUTTON_CLASS}
          >
            <Trash className="size-3.5" />
          </Button>

          {canUnsendSelected ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onUnsendSelected}
              aria-label={
                selectedCount > 1
                  ? t("header.unsendSelectedAria")
                  : t("header.unsendAria")
              }
              title={t("header.unsendTitle")}
              className={cn(
                HEADER_ACTION_BUTTON_CLASS,
                "text-destructive hover:text-destructive"
              )}
            >
              <Undo2 className="size-3.5" />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClearSelection}
            aria-label={t("header.cancelSelectionAria")}
            title={t("header.cancelSelectionAria")}
            className={HEADER_ACTION_BUTTON_CLASS}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggleSearch}
          aria-label={
            isSearchOpen
              ? t("header.closeSearchAria")
              : t("header.searchAria")
          }
          className={HEADER_ACTION_BUTTON_CLASS}
        >
          {isSearchOpen ? (
            <X className="size-3.5" />
          ) : (
            <Search className="size-3.5" />
          )}
        </Button>
      )}
    </header>
  )
}

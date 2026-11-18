import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { format, isSameDay, isToday, isYesterday, parseISO } from "date-fns"
import { useTranslation } from "react-i18next"
import { Check, CheckCheck, MessageCircle, Reply } from "lucide-react"
import i18n, { getDateFnsLocale } from "@/lib/i18n"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Marker, MarkerContent } from "@/components/ui/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import { useLongPress } from "@/hooks/useLongPress"
import { cn } from "@/lib/utils"
import type { Activity, ChatActivityContent } from "@/types/activity"

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"] as const
const HIGHLIGHT_DURATION_MS = 1_800

interface ChatMessageListProps {
  messages: Activity<ChatActivityContent>[]
  searchQuery?: string
  activeSearchMatchId?: number | null
  isSelectionMode: boolean
  selectedIds: Set<number>
  currentUserId?: string
  partnerName: string
  partnerAvatar?: string
  partnerReadAt?: string | null
  isPartnerTyping: boolean
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onSelectMessage: (activityId: number) => void
  onToggleSelectMessage: (activityId: number) => void
  onReact: (activity: Activity<ChatActivityContent>, emoji: string) => void
}

interface DaySection {
  dayKey: string
  label: string
  runs: SenderRun[]
}

interface SenderRun {
  runKey: string
  userId: string
  isMine: boolean
  items: Activity<ChatActivityContent>[]
}

function isImageUrl(value?: string): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  )
}

function formatDayLabel(date: Date, language?: string): string {
  if (isToday(date)) return i18n.t("chat:messageList.today")
  if (isYesterday(date)) return i18n.t("chat:messageList.yesterday")
  return format(date, "MMM d, yyyy", { locale: getDateFnsLocale(language) })
}

function groupReactions(reactions?: Record<string, string>) {
  if (!reactions) return []
  const counts = new Map<
    string,
    { emoji: string; count: number; userIds: string[] }
  >()
  for (const [uid, emoji] of Object.entries(reactions)) {
    const existing = counts.get(emoji)
    if (existing) {
      existing.count += 1
      existing.userIds.push(uid)
    } else {
      counts.set(emoji, { emoji, count: 1, userIds: [uid] })
    }
  }
  return Array.from(counts.values())
}

function renderHighlightedText(text: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const parts: ReactNode[] = []
  let startIndex = 0
  let matchIndex = lowerText.indexOf(lowerQuery, startIndex)
  let keyCounter = 0

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      parts.push(text.slice(startIndex, matchIndex))
    }
    const endIndex = matchIndex + trimmed.length
    parts.push(
      <mark
        key={keyCounter++}
        className="rounded-xs bg-amber-300/80 px-0.5 text-foreground dark:bg-amber-400/40"
      >
        {text.slice(matchIndex, endIndex)}
      </mark>
    )
    startIndex = endIndex
    matchIndex = lowerText.indexOf(lowerQuery, startIndex)
  }

  if (startIndex < text.length) {
    parts.push(text.slice(startIndex))
  }

  return parts.length > 0 ? parts : text
}

function SearchScrollSync({
  activeSearchMatchId,
}: {
  activeSearchMatchId?: number | null
}) {
  const { scrollToMessage } = useMessageScroller()

  useEffect(() => {
    if (activeSearchMatchId == null) return
    scrollToMessage(String(activeSearchMatchId), {
      behavior: "smooth",
      align: "center",
    })
  }, [activeSearchMatchId, scrollToMessage])

  return null
}

interface ChatMessageRowProps {
  item: Activity<ChatActivityContent>
  isMine: boolean
  isLastInRun: boolean
  isSelectionMode: boolean
  isSelected: boolean
  showReactionBar: boolean
  isHighlighted: boolean
  isActiveSearchMatch: boolean
  searchQuery: string
  currentUserId?: string
  partnerName: string
  partnerAvatar?: string
  partnerReadAt?: string | null
  onSelect: (activityId: number) => void
  onToggleSelect: (activityId: number) => void
  onReact: (activity: Activity<ChatActivityContent>, emoji: string) => void
  onHighlightMessage: (activityId: number) => void
}

const ChatMessageRow = memo(function ChatMessageRow({
  item,
  isMine,
  isLastInRun,
  isSelectionMode,
  isSelected,
  showReactionBar,
  isHighlighted,
  isActiveSearchMatch,
  searchQuery,
  currentUserId,
  partnerName,
  partnerAvatar,
  partnerReadAt,
  onSelect,
  onToggleSelect,
  onReact,
  onHighlightMessage,
}: ChatMessageRowProps) {
  const { t } = useTranslation("chat")
  const { scrollToMessage } = useMessageScroller()
  const isPersisted = item.id > 0

  const { isPressing, consumeLongPress, handlers } = useLongPress({
    disabled: !isPersisted,
    onLongPress: () => {
      if (isSelectionMode) {
        onToggleSelect(item.id)
      } else {
        onSelect(item.id)
      }
    },
  })

  const hasImageAvatar = isImageUrl(partnerAvatar)
  const align = isMine ? "end" : "start"
  const timeLabel = format(parseISO(item.created_at), "HH:mm")
  const reactions = groupReactions(item.content?.reactions)
  const myReaction = currentUserId
    ? item.content?.reactions?.[currentUserId]
    : undefined
  const replyTo = item.content?.replyTo
  const isEdited = Boolean(item.content?.editedAt)

  const isRead =
    isMine &&
    isPersisted &&
    !!partnerReadAt &&
    new Date(item.created_at).getTime() <= new Date(partnerReadAt).getTime()

  const handleRowClick = () => {
    if (consumeLongPress()) return
    if (isSelectionMode && isPersisted) {
      onToggleSelect(item.id)
    }
  }

  const handleReactionClick = (emoji: string) => {
    if (!isPersisted) return
    onReact(item, emoji)
  }

  return (
    <div
      {...handlers}
      onClick={handleRowClick}
      className={cn(
        "relative flex w-full items-center gap-2 rounded-xl px-2 py-0.5 transition-[background-color,transform] duration-200 select-none",
        isPressing && "scale-[0.985]",
        isSelectionMode && isPersisted && "cursor-pointer",
        isSelected && "bg-primary/15",
        !isSelected && isHighlighted && "bg-primary/20 ring-1 ring-primary/40",
        !isSelected &&
          !isHighlighted &&
          isActiveSearchMatch &&
          "bg-amber-500/15 ring-1 ring-amber-500/40"
      )}
    >
      {isSelectionMode ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 bg-background/70"
          )}
        >
          {isSelected ? <Check className="size-2.5 stroke-[3]" /> : null}
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <Message align={align}>
          {!isMine ? (
            isLastInRun ? (
              <MessageAvatar>
                <Avatar className="size-7">
                  {hasImageAvatar ? (
                    <AvatarImage src={partnerAvatar} alt={partnerName} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {partnerAvatar && !hasImageAvatar
                      ? partnerAvatar
                      : partnerName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </MessageAvatar>
            ) : (
              <div className="w-7 shrink-0" aria-hidden="true" />
            )
          ) : null}

          <MessageContent className="gap-1">
            {showReactionBar ? (
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "mb-1 flex items-center gap-0.5 rounded-full border border-border/60 bg-background/95 px-1.5 py-1 shadow-lg backdrop-blur-md",
                  isMine ? "self-end" : "self-start"
                )}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={myReaction === emoji ? "secondary" : "ghost"}
                    size="icon-xs"
                    onClick={() => handleReactionClick(emoji)}
                    aria-label={t("messageList.reactAria", { emoji })}
                    className="size-7 rounded-full text-base transition-transform hover:scale-110"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            ) : null}

            {replyTo ? (
              <div
                className={cn(
                  "flex flex-col gap-0.5",
                  isMine ? "items-end" : "items-start"
                )}
              >
                <span className="inline-flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                  <Reply className="size-2.5" />
                  <span>Replied to {replyTo.senderName}</span>
                </span>
                <Bubble variant="outline" align={align} className="max-w-[85%]">
                  <BubbleContent
                    render={
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isSelectionMode) return
                          e.stopPropagation()
                          scrollToMessage(String(replyTo.id), {
                            behavior: "smooth",
                            align: "center",
                          })
                          onHighlightMessage(replyTo.id)
                        }}
                      />
                    }
                    className="line-clamp-2 rounded-xl px-2.5 py-1 text-[11px] leading-snug text-muted-foreground"
                  >
                    {replyTo.text}
                  </BubbleContent>
                </Bubble>
              </div>
            ) : null}

            <div
              className={cn(
                "flex items-center gap-1.5",
                isMine ? "flex-row-reverse self-end" : "flex-row self-start",
                reactions.length > 0 && "mb-2.5"
              )}
            >
              <Bubble
                variant={isMine ? "default" : "muted"}
                align={align}
                className="max-w-full"
              >
                <BubbleContent className="rounded-2xl px-3 py-1.5 text-xs leading-snug whitespace-pre-wrap select-text">
                  {renderHighlightedText(item.content?.text ?? "", searchQuery)}
                </BubbleContent>

                {reactions.length > 0 ? (
                  <BubbleReactions side="bottom" align={align}>
                    {reactions.map((r) => {
                      const isMineReaction = currentUserId
                        ? r.userIds.includes(currentUserId)
                        : false
                      return (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={(e) => {
                            if (isSelectionMode) return
                            e.stopPropagation()
                            handleReactionClick(r.emoji)
                          }}
                          aria-label={t("messageList.toggleReactionAria", {
                            emoji: r.emoji,
                          })}
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs leading-none transition-colors hover:bg-muted-foreground/15",
                            isMineReaction &&
                              "bg-primary/15 font-medium text-primary"
                          )}
                        >
                          <span>{r.emoji}</span>
                          {r.count > 1 ? <span>{r.count}</span> : null}
                        </button>
                      )
                    })}
                  </BubbleReactions>
                ) : null}
              </Bubble>
            </div>

            {isLastInRun || isEdited ? (
              <MessageFooter className="gap-1 px-2 text-[10px]">
                {isEdited ? <span>{t("messageList.edited")}</span> : null}
                {isEdited && isLastInRun ? <span>·</span> : null}
                {isLastInRun ? <span>{timeLabel}</span> : null}
                {isLastInRun && isMine ? (
                  isRead ? (
                    <CheckCheck
                      className="size-3 text-primary"
                      aria-label={t("messageList.readAria")}
                    />
                  ) : (
                    <Check
                      className="size-3 text-muted-foreground"
                      aria-label={t("messageList.sentAria")}
                    />
                  )
                ) : null}
              </MessageFooter>
            ) : null}
          </MessageContent>
        </Message>
      </div>
    </div>
  )
})

export const ChatMessageList = memo(function ChatMessageList({
  messages,
  searchQuery = "",
  activeSearchMatchId = null,
  isSelectionMode,
  selectedIds,
  currentUserId,
  partnerName,
  partnerAvatar,
  partnerReadAt,
  isPartnerTyping,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSelectMessage,
  onToggleSelectMessage,
  onReact,
}: ChatMessageListProps) {
  const { t, i18n: i18nInstance } = useTranslation("chat")
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    number | null
  >(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleHighlightMessage = useCallback((activityId: number) => {
    setHighlightedMessageId(activityId)
    if (highlightTimerRef.current !== null) {
      clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedMessageId(null)
      highlightTimerRef.current = null
    }, HIGHLIGHT_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  const sections = useMemo<DaySection[]>(() => {
    const result: DaySection[] = []

    for (const msg of messages) {
      const date = parseISO(msg.created_at)
      const dayKey = format(date, "yyyy-MM-dd")
      const isMine = msg.user_id === currentUserId

      let daySection = result[result.length - 1]
      if (!daySection || !isSameDay(parseISO(daySection.dayKey), date)) {
        daySection = {
          dayKey,
          label: formatDayLabel(date, i18nInstance.language),
          runs: [],
        }
        result.push(daySection)
      }

      const lastRun = daySection.runs[daySection.runs.length - 1]
      if (lastRun && lastRun.userId === msg.user_id) {
        lastRun.items.push(msg)
      } else {
        daySection.runs.push({
          runKey: `${dayKey}-${msg.id}`,
          userId: msg.user_id,
          isMine,
          items: [msg],
        })
      }
    }

    return result
  }, [messages, currentUserId, i18nInstance.language])

  const hasImageAvatar = isImageUrl(partnerAvatar)
  const selectedCount = selectedIds.size

  if (messages.length === 0 && !isPartnerTyping) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pt-20 pb-28">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyTitle>{t("messageList.emptyTitle")}</EmptyTitle>
            <EmptyDescription>
              {t("messageList.emptyDescription", { name: partnerName })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <MessageScrollerProvider autoScroll>
      <SearchScrollSync activeSearchMatchId={activeSearchMatchId} />
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport className="px-2 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))]">
          <MessageScrollerContent className="gap-3">
            {hasNextPage ? (
              <MessageScrollerItem messageId="load-more">
                <div className="flex justify-center py-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFetchingNextPage}
                    onClick={onLoadMore}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        {t("messageList.loadingOlder")}
                      </>
                    ) : (
                      t("messageList.loadOlder")
                    )}
                  </Button>
                </div>
              </MessageScrollerItem>
            ) : null}

            {sections.map((section) => (
              <div key={section.dayKey} className="flex flex-col gap-2.5">
                <MessageScrollerItem messageId={`day-${section.dayKey}`}>
                  <Marker variant="separator" className="text-[11px]">
                    <MarkerContent>{section.label}</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                {section.runs.map((run) => (
                  <MessageGroup
                    key={run.runKey}
                    className="gap-1 [contain-intrinsic-size:auto_72px] [content-visibility:auto]"
                  >
                    {run.items.map((item, index) => {
                      const isSelected = selectedIds.has(item.id)
                      return (
                        <MessageScrollerItem
                          key={item.id}
                          messageId={String(item.id)}
                          scrollAnchor={run.isMine}
                        >
                          <ChatMessageRow
                            item={item}
                            isMine={run.isMine}
                            isLastInRun={index === run.items.length - 1}
                            isSelectionMode={isSelectionMode}
                            isSelected={isSelected}
                            showReactionBar={selectedCount === 1 && isSelected}
                            isHighlighted={highlightedMessageId === item.id}
                            isActiveSearchMatch={
                              activeSearchMatchId === item.id
                            }
                            searchQuery={searchQuery}
                            currentUserId={currentUserId}
                            partnerName={partnerName}
                            partnerAvatar={partnerAvatar}
                            partnerReadAt={partnerReadAt}
                            onSelect={onSelectMessage}
                            onToggleSelect={onToggleSelectMessage}
                            onReact={onReact}
                            onHighlightMessage={handleHighlightMessage}
                          />
                        </MessageScrollerItem>
                      )
                    })}
                  </MessageGroup>
                ))}
              </div>
            ))}

            {isPartnerTyping ? (
              <MessageScrollerItem messageId="partner-typing">
                <div className="px-2">
                  <Message align="start">
                    <MessageAvatar>
                      <Avatar className="size-7">
                        {hasImageAvatar ? (
                          <AvatarImage src={partnerAvatar} alt={partnerName} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {partnerAvatar && !hasImageAvatar
                            ? partnerAvatar
                            : partnerName.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                    <MessageContent>
                      <Bubble variant="muted" align="start">
                        <BubbleContent className="flex items-center gap-1 rounded-2xl px-3 py-2">
                          <span className="size-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                          <span className="size-1 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                          <span className="size-1 animate-bounce rounded-full bg-muted-foreground/60" />
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </div>
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton className="z-30 shadow-md data-[direction=end]:bottom-[calc(7.75rem+env(safe-area-inset-bottom))]" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
})

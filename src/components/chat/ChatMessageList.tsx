import { useMemo, useState } from "react"
import { format, isSameDay, isToday, isYesterday, parseISO } from "date-fns"
import {
  Check,
  CheckCheck,
  MessageCircle,
  MoreHorizontal,
  Reply,
  Trash2,
} from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type {
  Activity,
  ChatActivityContent,
  ChatReplyRef,
} from "@/types/activity"

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"] as const

interface ChatMessageListProps {
  messages: Activity<ChatActivityContent>[]
  currentUserId?: string
  currentUserName: string
  partnerName: string
  partnerAvatar?: string
  partnerReadAt?: string | null
  isPartnerTyping: boolean
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onReply: (reply: ChatReplyRef) => void
  onReact: (activity: Activity<ChatActivityContent>, emoji: string) => void
  onUnsend: (activityId: number) => void
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

function formatDayLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d, yyyy")
}

function groupReactions(reactions?: Record<string, string>) {
  if (!reactions) return []
  const counts = new Map<string, { emoji: string; count: number; userIds: string[] }>()
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

interface ChatMessageRowProps {
  item: Activity<ChatActivityContent>
  isMine: boolean
  isLastInRun: boolean
  currentUserId?: string
  currentUserName: string
  partnerName: string
  partnerAvatar?: string
  partnerReadAt?: string | null
  onReply: (reply: ChatReplyRef) => void
  onReact: (activity: Activity<ChatActivityContent>, emoji: string) => void
  onUnsend: (activityId: number) => void
}

function ChatMessageRow({
  item,
  isMine,
  isLastInRun,
  currentUserId,
  currentUserName,
  partnerName,
  partnerAvatar,
  partnerReadAt,
  onReply,
  onReact,
  onUnsend,
}: ChatMessageRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollToMessage } = useMessageScroller()

  const hasImageAvatar = isImageUrl(partnerAvatar)
  const align = isMine ? "end" : "start"
  const timeLabel = format(parseISO(item.created_at), "HH:mm")
  const reactions = groupReactions(item.content?.reactions)
  const myReaction = currentUserId
    ? item.content?.reactions?.[currentUserId]
    : undefined
  const replyTo = item.content?.replyTo

  const isRead =
    isMine &&
    item.id > 0 &&
    !!partnerReadAt &&
    new Date(item.created_at).getTime() <= new Date(partnerReadAt).getTime()

  const handleReplyClick = () => {
    setMenuOpen(false)
    onReply({
      id: item.id,
      userId: item.user_id,
      senderName: isMine ? currentUserName : partnerName,
      text: item.content?.text ?? "",
    })
  }

  const handleReactionClick = (emoji: string) => {
    setMenuOpen(false)
    if (item.id <= 0) return
    onReact(item, emoji)
  }

  const handleUnsendClick = () => {
    setMenuOpen(false)
    if (item.id <= 0) return
    onUnsend(item.id)
  }

  return (
    <Message align={align}>
      {!isMine ? (
        isLastInRun ? (
          <MessageAvatar>
            <Avatar size="sm">
              {hasImageAvatar ? (
                <AvatarImage src={partnerAvatar} alt={partnerName} />
              ) : null}
              <AvatarFallback>
                {partnerAvatar && !hasImageAvatar
                  ? partnerAvatar
                  : partnerName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>
        ) : (
          <div className="w-8 shrink-0" aria-hidden="true" />
        )
      ) : null}

      <MessageContent className="gap-1">
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
                    onClick={() => {
                      scrollToMessage(String(replyTo.id), {
                        behavior: "smooth",
                        align: "center",
                      })
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
            "group/row flex items-center gap-1.5",
            isMine ? "flex-row-reverse self-end" : "flex-row self-start",
            reactions.length > 0 && "mb-2.5"
          )}
        >
          <Bubble
            variant={isMine ? "default" : "muted"}
            align={align}
            className="max-w-full"
          >
            <BubbleContent className="rounded-2xl px-3 py-1.5 text-xs leading-snug whitespace-pre-wrap">
              {item.content?.text ?? ""}
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
                      onClick={() => handleReactionClick(r.emoji)}
                      aria-label={`Toggle ${r.emoji} reaction`}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs leading-none transition-colors hover:bg-muted-foreground/15",
                        isMineReaction && "bg-primary/15 font-medium text-primary"
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

          {item.id > 0 ? (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Message actions"
                    className={cn(
                      "shrink-0 text-muted-foreground transition-opacity md:opacity-0 md:group-hover/row:opacity-100 md:focus-visible:opacity-100",
                      menuOpen && "opacity-100 md:opacity-100"
                    )}
                  />
                }
              >
                <MoreHorizontal data-icon />
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align={isMine ? "end" : "start"}
                className="w-auto gap-2 rounded-2xl p-2"
              >
                <div className="flex items-center gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={myReaction === emoji ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => handleReactionClick(emoji)}
                      aria-label={`React with ${emoji}`}
                      className="rounded-full text-base"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-1 border-t border-border/60 pt-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReplyClick}
                    className="h-7 flex-1 justify-start gap-1.5 px-2 text-xs"
                  >
                    <Reply data-icon="inline-start" />
                    Reply
                  </Button>

                  {isMine ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleUnsendClick}
                      className="h-7 flex-1 justify-start gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 data-icon="inline-start" />
                      Unsend
                    </Button>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        {isLastInRun ? (
          <MessageFooter className="gap-1 px-2 text-[10px]">
            <span>{timeLabel}</span>
            {isMine ? (
              isRead ? (
                <CheckCheck
                  className="size-3 text-primary"
                  aria-label="Read"
                />
              ) : (
                <Check
                  className="size-3 text-muted-foreground"
                  aria-label="Sent"
                />
              )
            ) : null}
          </MessageFooter>
        ) : null}
      </MessageContent>
    </Message>
  )
}

export function ChatMessageList({
  messages,
  currentUserId,
  currentUserName,
  partnerName,
  partnerAvatar,
  partnerReadAt,
  isPartnerTyping,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onReply,
  onReact,
  onUnsend,
}: ChatMessageListProps) {
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
          label: formatDayLabel(date),
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
  }, [messages, currentUserId])

  const hasImageAvatar = isImageUrl(partnerAvatar)

  if (messages.length === 0 && !isPartnerTyping) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Start a private conversation with {partnerName}. Messages sync in
              real time.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport className="px-4 pt-2.5 pb-16">
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
                        Loading...
                      </>
                    ) : (
                      "Load older messages"
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
                  <MessageGroup key={run.runKey} className="gap-1">
                    {run.items.map((item, index) => (
                      <MessageScrollerItem
                        key={item.id}
                        messageId={String(item.id)}
                        scrollAnchor={run.isMine}
                      >
                        <ChatMessageRow
                          item={item}
                          isMine={run.isMine}
                          isLastInRun={index === run.items.length - 1}
                          currentUserId={currentUserId}
                          currentUserName={currentUserName}
                          partnerName={partnerName}
                          partnerAvatar={partnerAvatar}
                          partnerReadAt={partnerReadAt}
                          onReply={onReply}
                          onReact={onReact}
                          onUnsend={onUnsend}
                        />
                      </MessageScrollerItem>
                    ))}
                  </MessageGroup>
                ))}
              </div>
            ))}

            {isPartnerTyping ? (
              <MessageScrollerItem messageId="partner-typing">
                <Message align="start">
                  <MessageAvatar>
                    <Avatar size="sm">
                      {hasImageAvatar ? (
                        <AvatarImage src={partnerAvatar} alt={partnerName} />
                      ) : null}
                      <AvatarFallback>
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
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton className="data-[direction=end]:bottom-16" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

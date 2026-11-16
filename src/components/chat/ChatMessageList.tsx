import { useMemo } from "react"
import { format, isSameDay, isToday, isYesterday, parseISO } from "date-fns"
import { MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
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
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import type { Activity, ChatActivityContent } from "@/types/activity"

interface ChatMessageListProps {
  messages: Activity<ChatActivityContent>[]
  currentUserId?: string
  partnerName: string
  partnerAvatar?: string
  isPartnerTyping: boolean
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
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

export function ChatMessageList({
  messages,
  currentUserId,
  partnerName,
  partnerAvatar,
  isPartnerTyping,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
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
        <MessageScrollerViewport className="px-4 py-3">
          <MessageScrollerContent className="gap-4">
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
              <div key={section.dayKey} className="flex flex-col gap-4">
                <MessageScrollerItem messageId={`day-${section.dayKey}`}>
                  <Marker variant="separator" className="text-xs">
                    <MarkerContent>{section.label}</MarkerContent>
                  </Marker>
                </MessageScrollerItem>

                {section.runs.map((run) => (
                  <MessageGroup key={run.runKey} className="gap-1.5">
                    {run.items.map((item, index) => {
                      const isLastInRun = index === run.items.length - 1
                      const timeLabel = format(
                        parseISO(item.created_at),
                        "HH:mm"
                      )
                      const align = run.isMine ? "end" : "start"

                      return (
                        <MessageScrollerItem
                          key={item.id}
                          messageId={String(item.id)}
                          scrollAnchor={run.isMine}
                        >
                          <Message align={align}>
                            {!run.isMine ? (
                              isLastInRun ? (
                                <MessageAvatar>
                                  <Avatar size="sm">
                                    {hasImageAvatar ? (
                                      <AvatarImage
                                        src={partnerAvatar}
                                        alt={partnerName}
                                      />
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
                              <Bubble
                                variant={run.isMine ? "default" : "muted"}
                                align={align}
                              >
                                <BubbleContent className="whitespace-pre-wrap">
                                  {item.content?.text ?? ""}
                                </BubbleContent>
                              </Bubble>

                              {isLastInRun ? (
                                <MessageFooter className="text-[11px]">
                                  {timeLabel}
                                </MessageFooter>
                              ) : null}
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      )
                    })}
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
                      <BubbleContent className="flex items-center gap-1 py-3">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

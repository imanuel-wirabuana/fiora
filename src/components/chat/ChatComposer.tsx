import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Reply, SendHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import type { ChatReplyRef } from "@/types/activity"

interface ChatComposerProps {
  disabled?: boolean
  isSending?: boolean
  partnerName: string
  replyingTo?: ChatReplyRef | null
  onCancelReply?: () => void
  onSend: (input: { text: string; replyTo?: ChatReplyRef }) => Promise<unknown> | void
  onTypingChange: (hasContent: boolean) => void
  onStopTyping: () => void
}

export function ChatComposer({
  disabled = false,
  isSending = false,
  partnerName,
  replyingTo = null,
  onCancelReply,
  onSend,
  onTypingChange,
  onStopTyping,
}: ChatComposerProps) {
  const [text, setText] = useState("")

  const canSend = text.trim().length > 0 && !disabled && !isSending

  const submitMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isSending) return

    const activeReply = replyingTo ?? undefined
    setText("")
    onCancelReply?.()
    onStopTyping()
    await onSend({ text: trimmed, replyTo: activeReply })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void submitMessage()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void submitMessage()
    }
  }

  const handleChange = (value: string) => {
    setText(value)
    onTypingChange(value.trim().length > 0)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1.5 px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))]"
    >
      {replyingTo ? (
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <Reply className="size-3 shrink-0 text-primary" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground">
                Replying to {replyingTo.senderName}
              </span>
              <span className="truncate text-muted-foreground">
                {replyingTo.text}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X data-icon />
          </Button>
        </div>
      ) : null}

      <InputGroup className="pointer-events-auto items-end border-border/60 bg-background/90 shadow-lg backdrop-blur-md">
        <InputGroupTextarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onStopTyping}
          placeholder={`Message ${partnerName}...`}
          rows={1}
          disabled={disabled}
          aria-label={`Message ${partnerName}`}
          className="max-h-28 min-h-9 py-2 text-xs leading-5"
        />
        <InputGroupAddon align="inline-end" className="py-0.5 pr-1">
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendHorizontal data-icon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

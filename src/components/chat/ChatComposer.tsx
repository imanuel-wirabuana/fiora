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
      className="flex shrink-0 flex-col gap-2 border-t border-border/60 bg-background px-3 py-2.5"
    >
      {replyingTo ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 px-3 py-1.5 text-[11px]">
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

      <InputGroup className="items-end">
        <InputGroupTextarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onStopTyping}
          placeholder={`Message ${partnerName}...`}
          rows={1}
          disabled={disabled}
          aria-label={`Message ${partnerName}`}
          className="max-h-28 min-h-8 py-1.5 text-xs"
        />
        <InputGroupAddon align="inline-end" className="pb-1.5">
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

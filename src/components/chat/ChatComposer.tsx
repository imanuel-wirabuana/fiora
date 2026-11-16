import { useState, type FormEvent, type KeyboardEvent } from "react"
import { SendHorizontal } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

interface ChatComposerProps {
  disabled?: boolean
  isSending?: boolean
  partnerName: string
  onSend: (text: string) => Promise<unknown> | void
  onTypingChange: (hasContent: boolean) => void
  onStopTyping: () => void
}

export function ChatComposer({
  disabled = false,
  isSending = false,
  partnerName,
  onSend,
  onTypingChange,
  onStopTyping,
}: ChatComposerProps) {
  const [text, setText] = useState("")

  const canSend = text.trim().length > 0 && !disabled && !isSending

  const submitMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isSending) return

    setText("")
    onStopTyping()
    await onSend(trimmed)
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
      className="shrink-0 border-t border-border/60 bg-background px-3 py-2.5"
    >
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
          className="max-h-28 min-h-9 py-2 text-sm"
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

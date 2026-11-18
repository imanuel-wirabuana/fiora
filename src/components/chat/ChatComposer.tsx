import { useState, type FormEvent, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pencil, Reply, SendHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type {
  Activity,
  ChatActivityContent,
  ChatReplyRef,
} from "@/types/activity"

interface ChatComposerProps {
  disabled?: boolean
  isSending?: boolean
  isEditing?: boolean
  partnerName: string
  replyingTo?: ChatReplyRef | null
  editingMessage?: Activity<ChatActivityContent> | null
  onCancelReply?: () => void
  onCancelEdit?: () => void
  onSend: (input: {
    text: string
    replyTo?: ChatReplyRef
  }) => Promise<unknown> | void
  onEditSave?: (
    activity: Activity<ChatActivityContent>,
    text: string
  ) => Promise<unknown> | void
  onTypingChange: (hasContent: boolean) => void
  onStopTyping: () => void
}

export function ChatComposer({
  disabled = false,
  isSending = false,
  isEditing = false,
  partnerName,
  replyingTo = null,
  editingMessage = null,
  onCancelReply,
  onCancelEdit,
  onSend,
  onEditSave,
  onTypingChange,
  onStopTyping,
}: ChatComposerProps) {
  const { t } = useTranslation("chat")
  const [text, setText] = useState(
    () => editingMessage?.content?.text ?? ""
  )

  const isBusy = isSending || isEditing
  const canSend = text.trim().length > 0 && !disabled && !isBusy

  const submitMessage = async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isBusy) return

    if (editingMessage) {
      setText("")
      onCancelEdit?.()
      onStopTyping()
      await onEditSave?.(editingMessage, trimmed)
      return
    }

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
    } else if (e.key === "Escape" && editingMessage) {
      e.preventDefault()
      onCancelEdit?.()
    }
  }

  const handleChange = (value: string) => {
    setText(value)
    if (!editingMessage) {
      onTypingChange(value.trim().length > 0)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pointer-events-none absolute inset-x-0 bottom-[calc(3.625rem+env(safe-area-inset-bottom))] z-20 flex flex-col gap-1.5 px-3 md:bottom-[3.375rem]"
    >
      {editingMessage ? (
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <Pencil className="size-3 shrink-0 text-primary" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground">
                {t("composer.editing")}
              </span>
              <span className="truncate text-muted-foreground">
                {editingMessage.content?.text ?? ""}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onCancelEdit}
            aria-label={t("composer.cancelEditAria")}
          >
            <X data-icon />
          </Button>
        </div>
      ) : replyingTo ? (
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <Reply className="size-3 shrink-0 text-primary" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground">
                {t("composer.replyingTo", { name: replyingTo.senderName })}
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
            aria-label={t("composer.cancelReplyAria")}
          >
            <X data-icon />
          </Button>
        </div>
      ) : null}

      {/* Floating input pill with smooth SVG cradle + standalone larger Send button */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="relative flex min-h-13 min-w-0 flex-1 items-start px-4 pt-1.5 pb-4">
          {/* Smooth floating backdrop with BottomNav-style shoulder fillets */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex flex-col drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          >
            <div className="flex-1 rounded-t-3xl bg-background" />
            <div className="grid h-6 w-full grid-cols-[calc(50%-30px)_112px_1fr]">
              <div className="h-full rounded-bl-3xl bg-background" />
              <svg
                viewBox="0 0 112 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-[112px] shrink-0 fill-background"
              >
                <path d="M0 0H112V24H99C92 24 89 22 85 20A33 33 0 0 0 27 20C23 22 20 24 13 24H0V0Z" />
              </svg>
              <div className="h-full rounded-br-3xl bg-background" />
            </div>
          </div>

          <Textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onStopTyping}
            autoFocus={Boolean(editingMessage)}
            placeholder={
              editingMessage
                ? t("composer.editPlaceholder")
                : t("composer.messagePlaceholder", { name: partnerName })
            }
            rows={1}
            disabled={disabled}
            aria-label={
              editingMessage
                ? t("composer.editAria")
                : t("composer.messageAria", { name: partnerName })
            }
            className="relative z-10 max-h-28 min-h-7 w-full resize-none border-0 bg-transparent px-0 py-1 text-xs leading-5 shadow-none outline-none focus-visible:ring-0 focus-visible:outline-none"
          />
        </div>

        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={!canSend}
          aria-label={
            editingMessage
              ? t("composer.saveEditAria")
              : t("composer.sendAria")
          }
          className="size-11 shrink-0 rounded-full shadow-lg"
        >
          {editingMessage ? (
            <Check className="size-5" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </Button>
      </div>
    </form>
  )
}

import { createPortal } from "react-dom"
import { Bell, Heart, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { useLocation } from "wouter"
import { usePhonePortal } from "@/components/PhonePortalContext"
import { useNotifications } from "@/hooks/useNotifications"
import { cn } from "@/lib/utils"
import { useHeadsUpStore } from "@/stores/headsUpStore"

function getCompactIcon(type?: string | null, emoji?: string) {
  const isPresence = type === "presence"

  let content: React.ReactNode
  if (emoji) {
    content = <span className="text-sm leading-none">{emoji}</span>
  } else {
    switch (type) {
      case "chat":
        content = <MessageCircle className="size-3.5 text-primary" />
        break
      case "mood":
        content = <Heart className="size-3.5 fill-primary text-primary" />
        break
      case "nudge":
        content = <Send className="size-3.5 text-amber-500" />
        break
      case "quiz":
        content = <Sparkles className="size-3.5 text-violet-500" />
        break
      default:
        content = <Bell className="size-3.5 text-muted-foreground" />
        break
    }
  }

  return (
    <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
      {content}
      {isPresence && (
        <span className="absolute right-0 bottom-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
      )}
    </span>
  )
}

export function HeadsUpNotification() {
  const [, navigate] = useLocation()
  const phonePortalRef = usePhonePortal()
  const active = useHeadsUpStore((s) => s.active)
  const dismiss = useHeadsUpStore((s) => s.dismiss)
  const { markAsRead } = useNotifications()

  if (!active) return null

  const isPortaled = Boolean(phonePortalRef?.current)

  const handleOpen = () => {
    if (active.notification) {
      void markAsRead(active.notification)
    }
    dismiss()
    navigate(active.url || "/notification")
  }

  const banner = (
    <div
      className={cn(
        "pointer-events-none inset-x-3 top-2.5 z-50 flex justify-center animate-in fade-in slide-in-from-top-2 duration-200",
        isPortaled ? "absolute" : "fixed mx-auto max-w-md"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleOpen()
          }
        }}
        className="pointer-events-auto flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-md transition-colors hover:bg-muted/40"
      >
        {getCompactIcon(active.type, active.emoji)}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight font-semibold text-foreground">
            {active.title || "Notification"}
          </p>
          {active.body && (
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {active.body}
            </p>
          )}
        </div>

        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  )

  if (phonePortalRef?.current) {
    return createPortal(banner, phonePortalRef.current)
  }

  return banner
}

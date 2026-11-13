import { useState, type ReactNode } from "react"
import { Heart, Send } from "lucide-react"
import { cn } from "../lib/utils"
import { useRelationship } from "../hooks/useRelationship"
import { useActivities } from "../hooks/useActivities"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer"
import { Spinner } from "./ui/spinner"

interface MoodDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children?: ReactNode
}

export function MoodDrawer({ open, onOpenChange, children }: MoodDrawerProps) {
  const { moodOptions } = useRelationship()
  const { logMood, createActivityMutation } = useActivities()
  const [selectedMood, setSelectedMood] = useState<string>(
    () => moodOptions[0]?.label || "Loved"
  )
  const [note, setNote] = useState("")
  const [isSent, setIsSent] = useState(false)

  const isPending = createActivityMutation.isPending

  const handleSendMood = () => {
    const currentOption = moodOptions.find((m) => m.label === selectedMood) || {
      emoji: "🥰",
      label: selectedMood || "Loved",
    }

    // Fire mutation optimistically without blocking UI completion
    logMood({
      emoji: currentOption.emoji,
      label: currentOption.label,
      note: note.trim() || undefined,
    }).catch(() => {
      // Error handled by queryClient mutation rollback
    })

    setIsSent(true)
    setTimeout(() => {
      setIsSent(false)
      onOpenChange(false)
      setNote("")
    }, 500)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      {children ? <DrawerTrigger>{children}</DrawerTrigger> : null}

      {/* Tightly padded Drawer Content docked flush to bottom with safe area */}
      <DrawerContent className="mx-auto flex flex-col inset-x-0 bottom-0 m-0 rounded-b-none rounded-t-4xl border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md [--drawer-inset:0px]">
        {/* Top Header */}
        <div>
          <DrawerHeader className="items-center pb-1 text-center md:text-center">
            <DrawerTitle className="text-base font-semibold">
              Quick Mood Check-in
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Let your partner know how you feel right now
            </DrawerDescription>
          </DrawerHeader>

          {/* Mood Emoji Selector (dynamically loaded from relationship) */}
          <div className="grid grid-cols-5 gap-2 px-1 py-3">
            {moodOptions.map((mood) => {
              const isSelected = selectedMood === mood.label
              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setSelectedMood(mood.label)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none text-center truncate w-full",
                      isSelected
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {mood.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Optional Short Note */}
          <div className="px-1 pt-0.5 pb-2">
            <input
              type="text"
              placeholder="Add a sweet note or what's on your mind... (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 w-full rounded-2xl border border-input bg-muted/20 px-3.5 text-xs outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Bottom Share Action */}
        <div className="p-1 pt-1 pb-0.5">
          <button
            type="button"
            onClick={handleSendMood}
            disabled={isSent || isPending}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-medium text-primary-foreground shadow-xs transition active:scale-[0.99]",
              isSent
                ? "bg-emerald-500"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSent ? (
              <>
                <Heart className="size-4 fill-current" />
                <span>Shared with Partner!</span>
              </>
            ) : isPending ? (
              <>
                <Spinner className="size-4" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Send to Partner</span>
              </>
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

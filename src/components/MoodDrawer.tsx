import { useMemo, useState, type ReactNode } from "react"
import { Heart, Send } from "lucide-react"
import { AnimatedEmoji } from "./AnimatedEmoji"
import { fireEmojiConfetti } from "../lib/confetti"
import { getMoodCategory } from "../lib/relationship"
import { cn } from "../lib/utils"
import { useRelationship } from "../hooks/useRelationship"
import { useActivities } from "../hooks/useActivities"
import { WheelPicker, type WheelOption } from "./pickers"
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
  const { myLatestMood, logMood, createActivityMutation } = useActivities()
  const [manualSelection, setManualSelection] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [isSent, setIsSent] = useState(false)

  const defaultMoodLabel = useMemo(() => {
    const latestLabel = myLatestMood?.content?.label?.trim().toLowerCase()
    if (latestLabel) {
      const matched = moodOptions.find(
        (m) => m.label.trim().toLowerCase() === latestLabel
      )
      if (matched) return matched.label
    }

    const neutralMood = moodOptions.find(
      (_, idx) => getMoodCategory(idx, moodOptions.length) === "neutral"
    )
    if (neutralMood) return neutralMood.label

    const midIndex = Math.floor(moodOptions.length / 2)
    return moodOptions[midIndex]?.label || "Loved"
  }, [moodOptions, myLatestMood])

  const selectedMood = manualSelection ?? defaultMoodLabel

  const wheelOptions = useMemo<WheelOption<string>[]>(
    () =>
      moodOptions.map((mood) => {
        const isSelected = mood.label === selectedMood
        return {
          value: mood.label,
          textValue: mood.label,
          label: (
            <span className="flex items-center justify-center gap-2.5">
              {isSelected ? (
                <AnimatedEmoji
                  emoji={mood.emoji}
                  size={32}
                  replayOnTap={false}
                  fallbackClassName="text-3xl leading-none"
                />
              ) : (
                <span className="text-3xl leading-none">{mood.emoji}</span>
              )}
              <span className="truncate text-sm">{mood.label}</span>
            </span>
          ),
        }
      }),
    [moodOptions, selectedMood]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setManualSelection(null)
    onOpenChange(nextOpen)
  }

  const isPending = createActivityMutation.isPending

  const handleSendMood = () => {
    const currentOption = moodOptions.find((m) => m.label === selectedMood) || {
      emoji: "🥰",
      label: selectedMood || "Loved",
      score: 1.0,
    }

    // Fire mutation optimistically without blocking UI completion
    logMood({
      emoji: currentOption.emoji,
      label: currentOption.label,
      score: currentOption.score,
      note: note.trim() || undefined,
    }).catch(() => {
      // Error handled by queryClient mutation rollback
    })

    fireEmojiConfetti(currentOption.emoji, currentOption.score)
    setIsSent(true)
    setTimeout(() => {
      setIsSent(false)
      handleOpenChange(false)
      setNote("")
    }, 500)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
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

          {/* Vertical Wheel Mood Picker */}
          <div className="my-2">
            {wheelOptions.length > 0 && (
              <WheelPicker
                options={wheelOptions}
                value={selectedMood}
                onChange={setManualSelection}
                optionItemHeight={52}
                visibleCount={12}
                highlightClassName="rounded-2xl border-primary/35 bg-[color-mix(in_oklab,var(--primary)_10%,var(--popover))]"
                ariaLabel="Mood picker"
              />
            )}
          </div>

          {/* Optional Short Note */}
          <div className="px-1 pt-2 pb-3">
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

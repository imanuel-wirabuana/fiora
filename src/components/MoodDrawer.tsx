import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Heart, Send } from "lucide-react"
import { AnimatedEmoji } from "./AnimatedEmoji"
import { fireEmojiConfetti } from "../lib/confetti"
import { getMoodCategory, getMoodCategoryBadge } from "../lib/relationship"
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

const SelectedMoodContext = createContext<string>("")

function MoodWheelEmoji({ emoji, label }: { emoji: string; label: string }) {
  const selectedMood = useContext(SelectedMoodContext)
  const isSelected = selectedMood === label
  const spanRef = useRef<HTMLSpanElement>(null)
  const [settledLabel, setSettledLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!isSelected) return
    if (!spanRef.current?.closest("[data-rwp-highlight-item]")) return

    const timer = setTimeout(() => {
      setSettledLabel(label)
    }, 150)

    return () => clearTimeout(timer)
  }, [isSelected, label])

  const showLottie = isSelected && settledLabel === label

  return (
    <span
      ref={spanRef}
      className="flex h-12 w-12 items-center justify-center text-5xl leading-none"
    >
      {showLottie ? (
        <AnimatedEmoji
          emoji={emoji}
          size={48}
          replayOnTap={false}
          fallbackClassName="text-5xl leading-none"
        />
      ) : (
        emoji
      )}
    </span>
  )
}

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
      moodOptions.map((mood, idx) => {
        const badge = getMoodCategoryBadge(idx, moodOptions.length)
        return {
          value: mood.label,
          textValue: mood.label,
          label: (
            <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
              <div className="flex min-w-0 items-center justify-start">
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              </div>

              <MoodWheelEmoji emoji={mood.emoji} label={mood.label} />

              <span className="min-w-0 truncate text-right text-lg">
                {mood.label}
              </span>
            </div>
          ),
        }
      }),
    [moodOptions]
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
              <SelectedMoodContext.Provider value={selectedMood}>
                <WheelPicker
                  options={wheelOptions}
                  value={selectedMood}
                  onChange={setManualSelection}
                  optionItemHeight={84}
                  visibleCount={8}
                  itemClassName="scale-100"
                  highlightClassName="inset-x-0 rounded-none border-0 bg-popover before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-3 before:z-0 before:rounded-2xl before:border before:border-primary/35 before:bg-primary/10 *:data-rwp-highlight-list:z-10"
                  ariaLabel="Mood picker"
                />
              </SelectedMoodContext.Provider>
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

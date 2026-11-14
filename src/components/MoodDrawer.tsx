import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Heart, Send } from "lucide-react"
import { AnimatedEmoji } from "./AnimatedEmoji"
import { fireEmojiConfetti } from "../lib/confetti"
import { getMoodCategory } from "../lib/relationship"
import { cn } from "../lib/utils"
import { useRelationship } from "../hooks/useRelationship"
import { useActivities } from "../hooks/useActivities"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "./ui/carousel"
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const isInternalScrollRef = useRef(false)
  const hasInitializedRef = useRef(false)

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

  const selectedIndex = useMemo(() => {
    const idx = moodOptions.findIndex((m) => m.label === selectedMood)
    return idx >= 0 ? idx : 0
  }, [moodOptions, selectedMood])

  const handleOpenChange = (nextOpen: boolean) => {
    setManualSelection(null)
    if (nextOpen) {
      hasInitializedRef.current = false
    }
    onOpenChange(nextOpen)
  }

  // Sync Embla position when drawer opens or selection changes externally
  useEffect(() => {
    if (!open || !carouselApi || moodOptions.length === 0) return

    const currentSnap = carouselApi.selectedScrollSnap()
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      carouselApi.scrollTo(selectedIndex, true)
      return
    }

    if (currentSnap !== selectedIndex && !isInternalScrollRef.current) {
      carouselApi.scrollTo(selectedIndex, false)
    }
    isInternalScrollRef.current = false
  }, [open, carouselApi, selectedIndex, moodOptions.length])

  // Re-initialize Embla when moodOptions count changes
  useEffect(() => {
    if (!carouselApi) return
    carouselApi.reInit()
    carouselApi.scrollTo(selectedIndex, true)
  }, [carouselApi, moodOptions.length, selectedIndex])

  // Listen to Embla select snaps
  useEffect(() => {
    if (!carouselApi) return

    const handleSelect = () => {
      const snapIndex = carouselApi.selectedScrollSnap()
      const picked = moodOptions[snapIndex]
      if (picked && picked.label !== selectedMood) {
        isInternalScrollRef.current = true
        setManualSelection(picked.label)
      }
    }

    carouselApi.on("select", handleSelect)
    return () => {
      carouselApi.off("select", handleSelect)
    }
  }, [carouselApi, moodOptions, selectedMood])

  const isPending = createActivityMutation.isPending

  const handleMoodClick = (index: number, label: string) => {
    carouselApi?.scrollTo(index)
    if (label !== selectedMood) {
      isInternalScrollRef.current = true
      setManualSelection(label)
    }
  }

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

          {/* Horizontal Wheel-Style Mood Picker (5 visible, unboxed, WheelPicker pattern) */}
          <div
            className="relative my-2 overflow-hidden py-2 select-none touch-pan-x"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Center selection highlight band */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-1 left-1/2 z-0 w-1/5 -translate-x-1/2 rounded-2xl border border-primary/35 bg-primary/10"
            />

            <Carousel
              orientation="horizontal"
              setApi={setCarouselApi}
              opts={{
                align: "center",
                containScroll: false,
                dragFree: false,
                startIndex: selectedIndex,
              }}
              className="relative z-10 w-full [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
            >
              <CarouselContent className="-ml-1 items-center">
                {moodOptions.map((mood, idx) => {
                  const isSelected = idx === selectedIndex
                  return (
                    <CarouselItem key={mood.label} className="basis-1/5 pl-1">
                      <button
                        type="button"
                        onClick={() => handleMoodClick(idx, mood.label)}
                        className={cn(
                          "relative z-10 flex w-full flex-col items-center justify-center gap-1 py-1.5 transition-all duration-150 outline-none active:scale-95",
                          isSelected
                            ? "scale-110 opacity-100"
                            : "scale-75 opacity-40 hover:opacity-75"
                        )}
                      >
                        {isSelected ? (
                          <AnimatedEmoji
                            emoji={mood.emoji}
                            size={48}
                            replayOnTap={false}
                            fallbackClassName="text-5xl"
                          />
                        ) : (
                          <span className="text-5xl leading-none">
                            {mood.emoji}
                          </span>
                        )}
                        <span
                          className={cn(
                            "w-full truncate text-center text-xs leading-tight",
                            isSelected
                              ? "font-semibold text-primary"
                              : "font-normal text-muted-foreground"
                          )}
                        >
                          {mood.label}
                        </span>
                      </button>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
            </Carousel>
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

import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react"
import lottie, {
  type AnimationItem,
} from "lottie-web/build/player/lottie_light"
import { getNotoLottieUrl } from "@/lib/emoji"
import {
  useIsInsideDrawer,
  useTabPaneActive,
} from "@/components/AnimationScopeContext"
import { cn } from "@/lib/utils"
import { observeViewport } from "@/lib/viewportObserver"
import { useIsAnimationsPaused } from "@/stores/animationStore"

type LottiePayload = Record<string, unknown>

const lottieCache = new Map<string, Promise<LottiePayload | null>>()

function fetchNotoLottie(url: string): Promise<LottiePayload | null> {
  const cached = lottieCache.get(url)
  if (cached) return cached

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) return null
      return res.json() as Promise<LottiePayload>
    })
    .catch(() => null)

  lottieCache.set(url, promise)
  return promise
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
let reducedMotionMql: MediaQueryList | null = null
const reducedMotionListeners = new Set<() => void>()

function getReducedMotionMql(): MediaQueryList | null {
  if (typeof window === "undefined") return null
  if (!reducedMotionMql) {
    reducedMotionMql = window.matchMedia(REDUCED_MOTION_QUERY)
    reducedMotionMql.addEventListener("change", () => {
      for (const listener of reducedMotionListeners) {
        listener()
      }
    })
  }
  return reducedMotionMql
}

function subscribeReducedMotion(callback: () => void): () => void {
  getReducedMotionMql()
  reducedMotionListeners.add(callback)
  return () => {
    reducedMotionListeners.delete(callback)
  }
}

function getReducedMotionSnapshot(): boolean {
  return getReducedMotionMql()?.matches ?? false
}

function getReducedMotionServerSnapshot(): boolean {
  return false
}

export interface AnimatedEmojiProps {
  emoji: string
  /** Rendered width and height in pixels (defaults to 36). */
  size?: number
  loop?: boolean
  autoplay?: boolean
  /** Replay the animation from frame 0 when tapped/clicked. */
  replayOnTap?: boolean
  /** Pause the animation externally. */
  paused?: boolean
  className?: string
  /** Typography classes applied to the native emoji fallback. */
  fallbackClassName?: string
}

/**
 * Renders a Google Noto Animated Emoji via Lottie (`lottie_light` SVG),
 * gracefully falling back to the native Unicode emoji while loading,
 * when unavailable on the CDN, or when `prefers-reduced-motion` is active.
 */
export const AnimatedEmoji = memo(function AnimatedEmoji({
  emoji,
  size = 36,
  loop = true,
  autoplay = true,
  replayOnTap = true,
  paused = false,
  className,
  fallbackClassName,
}: AnimatedEmojiProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const lottieContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)
  const isCompletedRef = useRef(false)
  const wasPlayingRef = useRef(autoplay)

  const [isInView, setIsInView] = useState(false)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const [loaded, setLoaded] = useState<{
    emoji: string
    data: LottiePayload
  } | null>(null)

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const isPaneActive = useTabPaneActive()
  const isInsideDrawer = useIsInsideDrawer()
  const isAnimationsPaused = useIsAnimationsPaused(isInsideDrawer)

  const animationData =
    !prefersReducedMotion && loaded?.emoji === emoji ? loaded.data : null
  const showLottie = Boolean(animationData && !prefersReducedMotion)
  const shouldHydrate = hasEnteredView && isPaneActive && !prefersReducedMotion
  const isPaused = paused || isAnimationsPaused || !isPaneActive || !isInView

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    return observeViewport(el, (inView) => {
      setIsInView(inView)
      if (inView) {
        setHasEnteredView(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!shouldHydrate) return

    let cancelled = false
    const url = getNotoLottieUrl(emoji)
    if (!url) return

    fetchNotoLottie(url).then((data) => {
      if (!cancelled && data) {
        setLoaded({ emoji, data })
      }
    })

    return () => {
      cancelled = true
    }
  }, [emoji, shouldHydrate])

  useEffect(() => {
    const container = lottieContainerRef.current
    if (!container || !animationData || prefersReducedMotion) return

    isCompletedRef.current = false
    wasPlayingRef.current = autoplay

    const anim = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop,
      autoplay,
      animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    })

    const handleComplete = () => {
      isCompletedRef.current = true
    }
    anim.addEventListener("complete", handleComplete)

    animationRef.current = anim

    return () => {
      anim.removeEventListener("complete", handleComplete)
      animationRef.current = null
      anim.destroy()
    }
  }, [animationData, autoplay, loop, prefersReducedMotion])

  useEffect(() => {
    const anim = animationRef.current
    if (!anim) return

    if (isPaused) {
      anim.pause()
    } else if (loop || !isCompletedRef.current) {
      if (autoplay || wasPlayingRef.current) {
        anim.play()
      }
    }
  }, [isPaused, loop, autoplay, animationData, prefersReducedMotion])

  const handleTap = () => {
    if (!replayOnTap || !animationRef.current) return
    isCompletedRef.current = false
    wasPlayingRef.current = true
    animationRef.current.goToAndPlay(0, true)
  }

  return (
    <div
      ref={wrapperRef}
      role={showLottie ? "img" : undefined}
      aria-label={showLottie ? emoji : undefined}
      onClick={showLottie ? handleTap : undefined}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center select-none",
        showLottie &&
          replayOnTap &&
          "cursor-pointer transition-transform active:scale-90",
        className
      )}
    >
      {showLottie ? (
        <div ref={lottieContainerRef} className="size-full" />
      ) : (
        <span
          aria-hidden="true"
          className={cn("leading-none select-none", fallbackClassName)}
        >
          {emoji}
        </span>
      )}
    </div>
  )
})

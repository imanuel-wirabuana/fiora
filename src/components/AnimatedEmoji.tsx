import { useEffect, useRef, useState } from "react"
import lottie, { type AnimationItem } from "lottie-web/build/player/lottie_light"
import { getNotoLottieUrl } from "@/lib/emoji"
import { cn } from "@/lib/utils"

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

interface AnimatedEmojiProps {
  emoji: string
  /** Rendered width and height in pixels (defaults to 36). */
  size?: number
  loop?: boolean
  autoplay?: boolean
  /** Replay the animation from frame 0 when tapped/clicked. */
  replayOnTap?: boolean
  className?: string
  /** Typography classes applied to the native emoji fallback. */
  fallbackClassName?: string
}

/**
 * Renders a Google Noto Animated Emoji via Lottie (`lottie_light` SVG),
 * gracefully falling back to the native Unicode emoji while loading,
 * when unavailable on the CDN, or when `prefers-reduced-motion` is active.
 */
export function AnimatedEmoji({
  emoji,
  size = 36,
  loop = true,
  autoplay = true,
  replayOnTap = true,
  className,
  fallbackClassName,
}: AnimatedEmojiProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)
  const [loaded, setLoaded] = useState<{
    emoji: string
    data: LottiePayload
  } | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  )

  const animationData =
    !prefersReducedMotion && loaded?.emoji === emoji ? loaded.data : null

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    let cancelled = false

    if (prefersReducedMotion) return

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
  }, [emoji, prefersReducedMotion])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !animationData || prefersReducedMotion) return

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

    animationRef.current = anim

    return () => {
      animationRef.current = null
      anim.destroy()
    }
  }, [animationData, autoplay, loop, prefersReducedMotion])

  const handleTap = () => {
    if (!replayOnTap || !animationRef.current) return
    animationRef.current.goToAndPlay(0, true)
  }

  if (!animationData || prefersReducedMotion) {
    return (
      <span
        aria-hidden="true"
        className={cn("leading-none select-none", fallbackClassName)}
      >
        {emoji}
      </span>
    )
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={emoji}
      onClick={handleTap}
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 select-none",
        replayOnTap && "cursor-pointer transition-transform active:scale-90",
        className
      )}
    />
  )
}


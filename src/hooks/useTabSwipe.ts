import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react"
import { useAnimationStore } from "@/stores/animationStore"

interface UseTabSwipeOptions {
  activeIndex: number
  tabCount: number
  onChangeIndex: (nextIndex: number) => void
}

interface GestureState {
  active: boolean
  lock: "none" | "horizontal" | "vertical"
  startX: number
  startY: number
  startTime: number
  lastX: number
}

const SLOP_PX = 10
const EDGE_GUARD_PX = 20
const SWIPE_DISTANCE_RATIO = 0.25
const SWIPE_VELOCITY_THRESHOLD = 0.35
const MIN_FLICK_DISTANCE_PX = 24
const EDGE_RESISTANCE = 0.25

function shouldIgnoreSwipeTarget(
  target: EventTarget | null,
  boundary: HTMLElement | null
): boolean {
  let current = target instanceof Element ? target : null

  while (current && current !== boundary) {
    const tag = current.tagName
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      (current instanceof HTMLElement && current.isContentEditable)
    ) {
      return true
    }

    if (
      current.getAttribute("role") === "slider" ||
      current.hasAttribute("data-no-tab-swipe")
    ) {
      return true
    }

    if (current.scrollWidth > current.clientWidth + 1) {
      const overflowX = window.getComputedStyle(current).overflowX
      if (overflowX === "auto" || overflowX === "scroll") {
        return true
      }
    }

    current = current.parentElement
  }

  return false
}

export function useTabSwipe({
  activeIndex,
  tabCount,
  onChangeIndex,
}: UseTabSwipeOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const pendingOffsetRef = useRef(0)
  const snapBackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapBackCleanupRef = useRef<(() => void) | null>(null)
  const [swipeActiveAtIndex, setSwipeActiveAtIndex] = useState<number | null>(null)
  const isSwipeActive = swipeActiveAtIndex === activeIndex

  const gestureRef = useRef<GestureState>({
    active: false,
    lock: "none",
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
  })

  const clearSnapBackWatch = useCallback(() => {
    if (snapBackTimerRef.current !== null) {
      clearTimeout(snapBackTimerRef.current)
      snapBackTimerRef.current = null
    }
    if (snapBackCleanupRef.current !== null) {
      snapBackCleanupRef.current()
      snapBackCleanupRef.current = null
    }
  }, [])

  useEffect(() => {
    clearSnapBackWatch()
  }, [activeIndex, clearSnapBackWatch])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      clearSnapBackWatch()
      useAnimationStore.getState().setTabSliding(false)
    }
  }, [clearSnapBackWatch])

  const cancelScheduledFrame = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const applyTrackTransform = (targetIndex: number, offsetPx = 0) => {
    const track = trackRef.current
    if (!track) return
    track.style.transform =
      offsetPx === 0
        ? `translate3d(-${targetIndex * 100}%, 0, 0)`
        : `translate3d(calc(-${targetIndex * 100}% + ${offsetPx}px), 0, 0)`
  }

  const clearPendingGesture = () => {
    cancelScheduledFrame()
    gestureRef.current.active = false
    gestureRef.current.lock = "none"
    pendingOffsetRef.current = 0
  }

  const resetGesture = (targetIndex = activeIndex) => {
    clearPendingGesture()

    const track = trackRef.current
    if (track) {
      track.style.transition = ""
      applyTrackTransform(targetIndex, 0)
    }
  }

  const watchSnapBackEnd = () => {
    clearSnapBackWatch()

    const finishSnapBack = () => {
      clearSnapBackWatch()
      setSwipeActiveAtIndex(null)
      useAnimationStore.getState().setTabSliding(false)
    }

    const track = trackRef.current
    if (track) {
      const onTransitionEnd = (event: TransitionEvent) => {
        if (event.target !== track || event.propertyName !== "transform") {
          return
        }
        finishSnapBack()
      }
      track.addEventListener("transitionend", onTransitionEnd)
      snapBackCleanupRef.current = () => {
        track.removeEventListener("transitionend", onTransitionEnd)
      }
    }

    snapBackTimerRef.current = setTimeout(finishSnapBack, 350)
  }

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      if (gestureRef.current.lock === "horizontal") {
        resetGesture(activeIndex)
        watchSnapBackEnd()
      } else {
        clearPendingGesture()
        setSwipeActiveAtIndex(null)
      }
      return
    }

    const touch = event.touches[0]
    if (touch.clientX < EDGE_GUARD_PX) {
      return
    }

    if (shouldIgnoreSwipeTarget(event.target, containerRef.current)) {
      return
    }

    const now = performance.now()
    gestureRef.current = {
      active: true,
      lock: "none",
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastX: touch.clientX,
    }
    setSwipeActiveAtIndex(activeIndex)
  }

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture.active || event.touches.length !== 1) {
      return
    }

    const touch = event.touches[0]
    const dx = touch.clientX - gesture.startX
    const dy = touch.clientY - gesture.startY

    if (gesture.lock === "none") {
      if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) {
        return
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.lock = "vertical"
        setSwipeActiveAtIndex(null)
        return
      }
      clearSnapBackWatch()
      gesture.lock = "horizontal"
      useAnimationStore.getState().setTabSliding(true)
      if (trackRef.current) {
        trackRef.current.style.transition = "none"
      }
    }

    if (gesture.lock !== "horizontal") {
      return
    }

    gesture.lastX = touch.clientX

    const isAtLeadingEdge = activeIndex === 0 && dx > 0
    const isAtTrailingEdge = activeIndex === tabCount - 1 && dx < 0
    pendingOffsetRef.current =
      isAtLeadingEdge || isAtTrailingEdge ? dx * EDGE_RESISTANCE : dx

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (gestureRef.current.lock === "horizontal") {
          applyTrackTransform(activeIndex, pendingOffsetRef.current)
        }
      })
    }
  }

  const onTouchEnd = () => {
    const gesture = gestureRef.current
    if (!gesture.active) {
      return
    }

    if (gesture.lock !== "horizontal") {
      clearPendingGesture()
      setSwipeActiveAtIndex(null)
      return
    }

    let nextIndex = activeIndex

    const dx = gesture.lastX - gesture.startX
    const dt = Math.max(1, performance.now() - gesture.startTime)
    const velocity = Math.abs(dx) / dt
    const width = containerRef.current?.clientWidth || window.innerWidth

    const passedDistance = Math.abs(dx) > width * SWIPE_DISTANCE_RATIO
    const passedVelocity =
      velocity > SWIPE_VELOCITY_THRESHOLD &&
      Math.abs(dx) > MIN_FLICK_DISTANCE_PX

    if (passedDistance || passedVelocity) {
      nextIndex =
        dx < 0
          ? Math.min(tabCount - 1, activeIndex + 1)
          : Math.max(0, activeIndex - 1)
    }

    resetGesture(nextIndex)

    if (nextIndex !== activeIndex) {
      setSwipeActiveAtIndex(null)
      onChangeIndex(nextIndex)
    } else {
      watchSnapBackEnd()
    }
  }

  const onTouchCancel = () => {
    const gesture = gestureRef.current
    if (!gesture.active && gesture.lock !== "horizontal") {
      return
    }

    if (gesture.lock === "horizontal") {
      resetGesture(activeIndex)
      watchSnapBackEnd()
    } else {
      clearPendingGesture()
      setSwipeActiveAtIndex(null)
    }
  }

  return {
    containerRef,
    trackRef,
    isSwipeActive,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  }
}

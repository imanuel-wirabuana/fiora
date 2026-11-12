import { useEffect, useRef, useState } from "react"
import { useLocation } from "wouter"

interface UseStickyHeaderOptions {
  /** Minimum scroll delta (in px) before toggling visibility to avoid jitter */
  threshold?: number
  /** Scroll offset (in px) from the top before the header can hide */
  hideOffset?: number
}

function getScrollTop(target: EventTarget): number {
  if (
    target === document ||
    target === document.documentElement ||
    target === document.body
  ) {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    )
  }
  if (target instanceof HTMLElement) {
    return target.scrollTop
  }
  return window.scrollY || 0
}

export function useStickyHeader({
  threshold = 10,
  hideOffset = 64,
}: UseStickyHeaderOptions = {}) {
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollYRef = useRef(0)
  const lastTargetRef = useRef<EventTarget | null>(null)
  const [location] = useLocation()
  const [hiddenState, setHiddenState] = useState({
    location,
    hidden: false,
  })

  const isHidden =
    hiddenState.location === location ? hiddenState.hidden : false

  useEffect(() => {
    lastScrollYRef.current = 0
    lastTargetRef.current = null

    const handleScroll = (event: Event) => {
      const headerEl = headerRef.current
      const target = event.target
      if (!headerEl || !target) return

      const isDocumentTarget =
        target === document ||
        target === document.documentElement ||
        target === document.body
      const isAncestorTarget =
        target instanceof HTMLElement && target.contains(headerEl)

      // Ignore scroll events from inner carousels, filter bars, or textareas
      if (!isDocumentTarget && !isAncestorTarget) {
        return
      }

      const currentScrollY = getScrollTop(target)

      if (
        lastTargetRef.current !== null &&
        lastTargetRef.current !== target
      ) {
        lastTargetRef.current = target
        lastScrollYRef.current = Math.max(0, currentScrollY)
        return
      }
      lastTargetRef.current = target

      // Keep header visible at the top and ignore iOS rubber-band overscroll
      if (currentScrollY <= 0) {
        lastScrollYRef.current = 0
        setHiddenState({ location, hidden: false })
        return
      }

      const delta = currentScrollY - lastScrollYRef.current
      if (Math.abs(delta) < threshold) {
        return
      }

      if (delta > 0 && currentScrollY > hideOffset) {
        setHiddenState({ location, hidden: true })
      } else if (delta < 0) {
        setHiddenState({ location, hidden: false })
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    })

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true })
    }
  }, [threshold, hideOffset, location])

  return { headerRef, isHidden }
}

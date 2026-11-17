import { useEffect, useRef, type RefObject } from "react"
import { useLocation } from "wouter"

const MAIN_TAB_ROUTE_RE = /^\/(home|insight|chat|space)\/?$/

/**
 * Resets scroll position to the top whenever the active route changes,
 * supporting both window scrolling (mobile) and container scrolling (desktop mockup).
 * Skips window scrolling when navigating between main tab pager routes without
 * an explicit container ref.
 */
export function useScrollToTop(containerRef?: RefObject<HTMLElement | null>) {
  const [location] = useLocation()
  const prevLocationRef = useRef<string | null>(null)

  useEffect(() => {
    const prevLocation = prevLocationRef.current
    prevLocationRef.current = location

    if (containerRef?.current) {
      containerRef.current.scrollTop = 0
    }

    const isSwitchingMainTabs =
      !containerRef &&
      prevLocation !== null &&
      MAIN_TAB_ROUTE_RE.test(prevLocation) &&
      MAIN_TAB_ROUTE_RE.test(location)

    if (!isSwitchingMainTabs && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }
  }, [location, containerRef])
}


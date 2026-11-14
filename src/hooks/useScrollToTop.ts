import { useEffect, type RefObject } from "react"
import { useLocation } from "wouter"

/**
 * Resets scroll position to the top whenever the active route changes,
 * supporting both window scrolling (mobile) and container scrolling (desktop mockup).
 */
export function useScrollToTop(containerRef?: RefObject<HTMLElement | null>) {
  const [location] = useLocation()

  useEffect(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTop = 0
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }
  }, [location, containerRef])
}


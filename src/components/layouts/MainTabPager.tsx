import {
  memo,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
  type TransitionEvent,
} from "react"
import { useLocation } from "wouter"
import { useTabSwipe } from "@/hooks/useTabSwipe"
import { TabPaneContext } from "@/components/AnimationScopeContext"
import { cn } from "@/lib/utils"
import { useAnimationStore } from "@/stores/animationStore"
import { MainLayout } from "./MainLayout"

export type MainTabPath = "/home" | "/insight" | "/chat" | "/space"

export interface MainTabPane {
  path: MainTabPath
  element: ReactNode
  /**
   * "scroll" wraps the pane in a vertical scroll container (default).
   * "fixed" lets the screen manage its own internal scroll (e.g. ChatScreen).
   */
  scrollMode?: "scroll" | "fixed"
}

interface MainTabPagerProps {
  panes: MainTabPane[]
}

const TabPaneItem = memo(function TabPaneItem({
  pane,
  isActive,
  isNearViewport,
  deferInert,
}: {
  pane: MainTabPane
  isActive: boolean
  isNearViewport: boolean
  deferInert: boolean
}) {
  const isScrollable = pane.scrollMode !== "fixed"

  return (
    <div
      aria-hidden={!isActive}
      inert={!isActive && !deferInert ? true : undefined}
      data-sticky-scroll={isActive && isScrollable ? "true" : undefined}
      className={cn(
        "h-full w-full shrink-0 pt-12 [contain:layout_paint]",
        !isActive && "pointer-events-none",
        !isNearViewport && "invisible",
        isScrollable
          ? "overflow-x-hidden overflow-y-auto"
          : "flex flex-col overflow-hidden"
      )}
    >
      <TabPaneContext.Provider value={isActive}>
        {pane.element}
      </TabPaneContext.Provider>
    </div>
  )
})

export function MainTabPager({ panes }: MainTabPagerProps) {
  const [location, setLocation] = useLocation()

  const activeIndex = Math.max(
    0,
    panes.findIndex((pane) => location.startsWith(pane.path))
  )
  const [settledIndex, setSettledIndex] = useState(activeIndex)
  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex)

  if (prevActiveIndex !== activeIndex) {
    setPrevActiveIndex(activeIndex)
    if (settledIndex === activeIndex) {
      setSettledIndex(prevActiveIndex)
    }
  }

  const isTransitioning = settledIndex !== activeIndex

  useLayoutEffect(() => {
    if (isTransitioning) {
      useAnimationStore.getState().setTabSliding(true)
    }
  }, [isTransitioning])

  useEffect(() => {
    if (settledIndex === activeIndex) return
    const timer = setTimeout(() => {
      setSettledIndex(activeIndex)
      useAnimationStore.getState().setTabSliding(false)
    }, 350)
    return () => clearTimeout(timer)
  }, [activeIndex, settledIndex])

  useEffect(() => {
    return () => {
      useAnimationStore.getState().setTabSliding(false)
    }
  }, [])

  const activePane = panes[activeIndex]
  const activePath = activePane?.path ?? "/home"

  const { containerRef, trackRef, isSwipeActive, touchHandlers } = useTabSwipe({
    activeIndex,
    tabCount: panes.length,
    onChangeIndex: (nextIndex) => {
      const target = panes[nextIndex]
      if (target) {
        setLocation(target.path)
      }
    },
  })

  const handleTrackTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current || e.propertyName !== "transform") {
      return
    }
    if (settledIndex !== activeIndex) {
      setSettledIndex(activeIndex)
      useAnimationStore.getState().setTabSliding(false)
    }
  }

  const minTransitionIndex = Math.min(settledIndex, activeIndex)
  const maxTransitionIndex = Math.max(settledIndex, activeIndex)

  return (
    <MainLayout
      variant="pager"
      headerTone={activePath === "/home" ? "primary-at-top" : "default"}
    >
      <div
        ref={containerRef}
        {...touchHandlers}
        className="relative min-h-0 flex-1 touch-pan-y overflow-hidden"
      >
        <div
          ref={trackRef}
          onTransitionEnd={handleTrackTransitionEnd}
          className="flex h-full w-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
          style={{
            transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
          }}
        >
          {panes.map((pane, index) => {
            const isNearViewport =
              index === activeIndex ||
              (isSwipeActive && Math.abs(index - activeIndex) <= 1) ||
              (isTransitioning &&
                index >= minTransitionIndex &&
                index <= maxTransitionIndex)

            return (
              <TabPaneItem
                key={pane.path}
                pane={pane}
                isActive={index === activeIndex}
                isNearViewport={isNearViewport}
                deferInert={isTransitioning}
              />
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}

import { memo, type ReactNode } from "react"
import { useLocation } from "wouter"
import { useTabSwipe } from "@/hooks/useTabSwipe"
import { cn } from "@/lib/utils"
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
}: {
  pane: MainTabPane
  isActive: boolean
}) {
  const isScrollable = pane.scrollMode !== "fixed"

  return (
    <div
      aria-hidden={!isActive}
      inert={!isActive ? true : undefined}
      data-sticky-scroll={isActive && isScrollable ? "true" : undefined}
      className={cn(
        "h-full w-full shrink-0 pt-12 backface-hidden [contain:layout_paint]",
        isScrollable
          ? "overflow-x-hidden overflow-y-auto"
          : "flex flex-col overflow-hidden"
      )}
    >
      {pane.element}
    </div>
  )
})

export function MainTabPager({ panes }: MainTabPagerProps) {
  const [location, setLocation] = useLocation()

  const activeIndex = Math.max(
    0,
    panes.findIndex((pane) => location.startsWith(pane.path))
  )
  const activePane = panes[activeIndex]
  const activePath = activePane?.path ?? "/home"

  const { containerRef, trackRef, touchHandlers } = useTabSwipe({
    activeIndex,
    tabCount: panes.length,
    onChangeIndex: (nextIndex) => {
      const target = panes[nextIndex]
      if (target) {
        setLocation(target.path)
      }
    },
  })

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
          className="flex h-full w-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
          style={{
            transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
          }}
        >
          {panes.map((pane, index) => (
            <TabPaneItem
              key={pane.path}
              pane={pane}
              isActive={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}

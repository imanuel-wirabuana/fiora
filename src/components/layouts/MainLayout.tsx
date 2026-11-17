import { useRef, type ReactNode } from "react"
import { useScrollToTop } from "@/hooks/useScrollToTop"
import { cn } from "@/lib/utils"
import { BottomNav } from "../BottomNav"
import { Header } from "../Header"

interface MainLayoutProps {
  children: ReactNode
  hasUnread?: boolean
  headerTone?: "default" | "primary-at-top"
  variant?: "default" | "pager"
}

export function MainLayout({
  children,
  hasUnread,
  headerTone = "default",
  variant = "default",
}: MainLayoutProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useScrollToTop(variant === "default" ? scrollContainerRef : undefined)

  const isPager = variant === "pager"

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        "flex flex-col bg-background text-foreground",
        isPager
          ? "relative h-svh overflow-hidden md:h-full md:min-h-0"
          : "min-h-svh md:h-full md:min-h-0 md:overflow-y-auto"
      )}
    >
      {/* Unified Mobile Top Header */}
      <Header
        variant="main"
        tone={headerTone}
        hasUnread={hasUnread}
        className={isPager ? "absolute inset-x-0 top-0" : undefined}
      />

      {/* Main content area */}
      <main
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col",
          isPager && "overflow-hidden"
        )}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

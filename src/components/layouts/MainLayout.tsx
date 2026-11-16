import { useRef, type ReactNode } from "react"
import { useScrollToTop } from "@/hooks/useScrollToTop"
import { BottomNav } from "../BottomNav"
import { Header } from "../Header"

interface MainLayoutProps {
  children: ReactNode
  hasUnread?: boolean
  headerTone?: "default" | "primary-at-top"
}

export function MainLayout({
  children,
  hasUnread,
  headerTone = "default",
}: MainLayoutProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useScrollToTop(scrollContainerRef)

  return (
    <div
      ref={scrollContainerRef}
      className="flex min-h-svh flex-col bg-background text-foreground md:h-full md:min-h-0 md:overflow-y-auto"
    >
      {/* Unified Mobile Top Header */}
      <Header variant="main" tone={headerTone} hasUnread={hasUnread} />

      {/* Main content area */}
      <main className="flex min-h-0 w-full flex-1 flex-col">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

import { useRef, type ReactNode } from "react"
import { useScrollToTop } from "@/hooks/useScrollToTop"
import { BottomNav } from "../BottomNav"
import { Header } from "../Header"

interface DetailLayoutProps {
  children: ReactNode
  title?: string
  backHref?: string
  rightAction?: ReactNode
}

export function DetailLayout({
  children,
  title = "Detail",
  backHref,
  rightAction,
}: DetailLayoutProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  useScrollToTop(scrollContainerRef)

  return (
    <div
      ref={scrollContainerRef}
      className="flex min-h-svh flex-col bg-background text-foreground md:h-full md:min-h-0 md:overflow-y-auto"
    >
      {/* Unified Detail Header */}
      <Header
        variant="detail"
        title={title}
        backHref={backHref}
        rightAction={rightAction}
      />

      {/* Main content area with bottom padding for navigation bar */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-3 pb-20 sm:max-w-2xl">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

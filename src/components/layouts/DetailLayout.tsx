import type { ReactNode } from "react"
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
  return (
    <div className="flex h-full min-h-svh flex-col overflow-y-auto bg-background text-foreground lg:min-h-full">
      {/* Unified Detail Header */}
      <Header
        variant="detail"
        title={title}
        backHref={backHref}
        rightAction={rightAction}
      />

      {/* Main content area with bottom padding for navigation bar */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-24 sm:max-w-2xl">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

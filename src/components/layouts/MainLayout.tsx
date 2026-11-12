import type { ReactNode } from "react"
import { BottomNav } from "../BottomNav"
import { Header } from "../Header"

interface MainLayoutProps {
  children: ReactNode
  hasUnread?: boolean
}

export function MainLayout({ children, hasUnread = true }: MainLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground md:h-full md:min-h-0 md:overflow-y-auto">
      {/* Unified Mobile Top Header */}
      <Header variant="main" hasUnread={hasUnread} />

      {/* Main content area */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-3 pb-20 sm:max-w-2xl">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

import type { ReactNode } from "react"
import { BottomNav } from "../BottomNav"
import { Header } from "../Header"

interface MainLayoutProps {
  children: ReactNode
  hasUnread?: boolean
}

export function MainLayout({ children, hasUnread = true }: MainLayoutProps) {
  return (
    <div className="flex h-full min-h-svh flex-col overflow-y-auto bg-background text-foreground lg:min-h-full">
      {/* Unified Mobile Top Header */}
      <Header variant="main" hasUnread={hasUnread} />

      {/* Main content area */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-24 sm:max-w-2xl">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

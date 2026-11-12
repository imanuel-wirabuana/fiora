import type { ReactNode } from "react"
import { Link } from "wouter"
import { ArrowLeft, Bell } from "lucide-react"
import { useStickyHeader } from "../hooks/useStickyHeader"
import { cn } from "../lib/utils"

export interface HeaderProps {
  variant?: "main" | "detail"
  title?: string
  backHref?: string
  hasUnread?: boolean
  rightAction?: ReactNode
  className?: string
}

export function Header({
  variant = "main",
  title,
  backHref,
  hasUnread = true,
  rightAction,
  className,
}: HeaderProps) {
  const { headerRef, isHidden } = useStickyHeader()
  const isDetail = variant === "detail" || !!title || !!backHref

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    }
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-30 shrink-0 bg-background transition-[translate,transform,box-shadow] duration-300 ease-in-out will-change-[translate,transform]",
        isHidden
          ? "pointer-events-none -translate-y-full shadow-none"
          : "translate-y-0",
        className
      )}
    >
      <div className="mx-auto flex h-12 max-w-md items-center justify-between px-4 sm:max-w-2xl">
        {/* Left Section */}
        {isDetail ? (
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="size-4.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="size-4.5" />
              </button>
            )}
            <span className="text-sm font-semibold tracking-tight">
              {title ?? "Detail"}
            </span>
          </div>
        ) : (
          <Link href="/home" className="text-base font-bold tracking-tight">
            Fiora
          </Link>
        )}

        {/* Right Section */}
        <div>
          {rightAction ? (
            rightAction
          ) : !isDetail ? (
            <Link
              href="/notification"
              className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              {hasUnread ? (
                <span className="absolute top-1 right-1 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

import { useState } from "react"
import { Link, useLocation } from "wouter"
import { BookOpen, Clock, Home, Plus, Settings } from "lucide-react"
import { MoodDrawer } from "./MoodDrawer"
import { cn } from "../lib/utils"

const navItemsLeft = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Clock },
]

const navItemsRight = [
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/setting", label: "Setting", icon: Settings },
]

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const [location] = useLocation()
  const [isMoodDrawerOpen, setIsMoodDrawerOpen] = useState(false)

  return (
    <nav
      aria-label="Bottom Navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-background pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2 sm:max-w-2xl">
        {/* Left Navigation Items */}
        {navItemsLeft.map((item) => {
          const Icon = item.icon
          const isActive = location.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-1 items-center justify-center py-2 text-center transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isActive ? "stroke-[2.5]" : "stroke-2"
                  )}
                />
              </div>
            </Link>
          )
        })}

        {/* Standout Center Action with Dedicated MoodDrawer */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsMoodDrawerOpen(true)}
            className={cn(
              "group relative flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95",
              isMoodDrawerOpen ? "rotate-45" : ""
            )}
            aria-label="Track Mood"
          >
            <Plus className="size-6 stroke-[2.5] transition-transform duration-200" />
            <span className="sr-only">Open mood tracker</span>
          </button>
        </div>

        {/* Right Navigation Items */}
        {navItemsRight.map((item) => {
          const Icon = item.icon
          const isActive = location.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex flex-1 items-center justify-center py-2 text-center transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    isActive ? "stroke-[2.5]" : "stroke-2"
                  )}
                />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Mood Drawer Component */}
      <MoodDrawer open={isMoodDrawerOpen} onOpenChange={setIsMoodDrawerOpen} />
    </nav>
  )
}

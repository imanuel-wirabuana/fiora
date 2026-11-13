import { useState } from "react"
import { Link, useLocation } from "wouter"
import {
  Clock,
  Home,
  LayoutGrid,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { MoodDrawer } from "./MoodDrawer"
import { cn } from "../lib/utils"
import { usePresenceStore } from "../stores/presenceStore"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const navItemsLeft: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Clock },
]

const navItemsRight: NavItem[] = [
  { href: "/space", label: "Space", icon: LayoutGrid },
  { href: "/setting", label: "Setting", icon: Settings },
]

function BottomNavItem({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      className={cn(
        "flex flex-1 items-center justify-center py-1 text-center transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-all",
          isActive ? "bg-primary/10" : "hover:bg-muted/50"
        )}
      >
        <Icon
          className={cn("size-4.5", isActive ? "stroke-[2.5]" : "stroke-2")}
        />
      </div>
    </Link>
  )
}

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const [location] = useLocation()
  const [isMoodDrawerOpen, setIsMoodDrawerOpen] = useState(false)
  const setCustomActivityOverride = usePresenceStore(
    (s) => s.setCustomActivityOverride
  )

  const handleMoodDrawerOpenChange = (open: boolean) => {
    setIsMoodDrawerOpen(open)
    setCustomActivityOverride(open ? "Logging a Mood" : null)
  }

  return (
    <nav
      aria-label="Bottom Navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-background pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="mx-auto flex h-13 max-w-md items-center justify-around px-2 sm:max-w-2xl">
        {/* Left Navigation Items */}
        {navItemsLeft.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            isActive={location.startsWith(item.href)}
          />
        ))}

        {/* Standout Center Action with Dedicated MoodDrawer */}
        <div className="relative -top-3.5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleMoodDrawerOpenChange(true)}
            className={cn(
              "group relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95",
              isMoodDrawerOpen ? "rotate-45" : ""
            )}
            aria-label="Track Mood"
          >
            <Plus className="size-5 stroke-[2.5] transition-transform duration-200" />
            <span className="sr-only">Open mood tracker</span>
          </button>
        </div>

        {/* Right Navigation Items */}
        {navItemsRight.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            isActive={location.startsWith(item.href)}
          />
        ))}
      </div>

      {/* Mood Drawer Component */}
      <MoodDrawer
        open={isMoodDrawerOpen}
        onOpenChange={handleMoodDrawerOpenChange}
      />
    </nav>
  )
}

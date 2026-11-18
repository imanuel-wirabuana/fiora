import { memo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "wouter"
import {
  BarChart3,
  Home,
  LayoutGrid,
  MessageCircle,
  Plus,
  type LucideIcon,
} from "lucide-react"
import { MoodDrawer } from "./MoodDrawer"
import { cn } from "../lib/utils"
import { usePresenceStore } from "../stores/presenceStore"

type NavAlign = "left" | "center" | "right"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  align: NavAlign
}

const alignClassMap: Record<NavAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
}

const navItemsLeft: NavItem[] = [
  { href: "/home", label: "nav.home", icon: Home, align: "center" },
  { href: "/insight", label: "nav.insight", icon: BarChart3, align: "right" },
]

const navItemsRight: NavItem[] = [
  { href: "/chat", label: "nav.chat", icon: MessageCircle, align: "left" },
  { href: "/space", label: "nav.space", icon: LayoutGrid, align: "center" },
]

const BottomNavItem = memo(function BottomNavItem({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const { t } = useTranslation("common")
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-label={t(item.label as "nav.home")}
      className={cn(
        "flex h-full w-full items-center py-1 text-center transition-colors",
        alignClassMap[item.align],
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-all duration-200",
          isActive ? "scale-105 bg-primary/10" : "scale-100 hover:bg-muted/50"
        )}
      >
        <Icon
          className={cn("size-4.5", isActive ? "stroke-[2.5]" : "stroke-2")}
        />
      </div>
    </Link>
  )
})

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const { t } = useTranslation("common")
  const [location] = useLocation()
  const [isMoodDrawerOpen, setIsMoodDrawerOpen] = useState(false)
  const setCustomActivityOverride = usePresenceStore(
    (s) => s.setCustomActivityOverride
  )

  const handleMoodDrawerOpenChange = (open: boolean) => {
    setIsMoodDrawerOpen(open)
    setCustomActivityOverride(open ? t("nav.loggingMood") : null)
  }

  return (
    <nav
      aria-label={t("nav.bottomNavigation")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:pb-4",
        className
      )}
    >
      {/* Background wings + left/right SVG inset cradle around the center button */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col"
      >
        <div className="flex h-13 w-full">
          <div className="flex-1 bg-background" />
          <svg
            viewBox="0 0 112 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-mx-px h-13 w-[112px] shrink-0 fill-background"
          >
            <path d="M0 0H12C20 0 22 6 24 14A33 33 0 0 0 88 14C90 6 92 0 100 0H112V52H0V0Z" />
          </svg>
          <div className="flex-1 bg-background" />
        </div>
        <div className="flex-1 bg-background" />
      </div>

      <div className="relative z-10 mx-auto grid h-13 max-w-md grid-cols-6 items-center px-2 sm:max-w-2xl">
        {/* Left Navigation Items */}
        {navItemsLeft.map((item) => (
          <BottomNavItem
            key={item.href}
            item={item}
            isActive={location.startsWith(item.href)}
          />
        ))}

        {/* Standout Center Action with Dedicated MoodDrawer */}
        <div className="relative -top-5 col-span-2 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={() => handleMoodDrawerOpenChange(true)}
            className={cn(
              "group relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95",
              isMoodDrawerOpen ? "rotate-45" : ""
            )}
            aria-label={t("nav.trackMood")}
          >
            <Plus className="size-6 stroke-[2.5] transition-transform duration-200" />
            <span className="sr-only">{t("nav.openMoodTracker")}</span>
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

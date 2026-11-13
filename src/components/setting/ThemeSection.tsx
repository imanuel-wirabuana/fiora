import * as React from "react"
import { Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { SettingRow } from "./SettingRow"

export function ThemeSection() {
  const { theme, setTheme } = useTheme()
  const switchRef = React.useRef<HTMLSpanElement>(null)

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const handleToggleDarkMode = (checked: boolean) => {
    const rect = switchRef.current?.getBoundingClientRect()
    const origin = rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      : undefined

    setTheme(checked ? "dark" : "light", origin)
  }

  return (
    <SettingRow
      icon={<Moon className="size-3.5" />}
      title="Dark Mode"
      description="Toggle dark and light appearance."
      action={
        <Switch
          ref={switchRef}
          checked={isDarkMode}
          onCheckedChange={handleToggleDarkMode}
          aria-label="Toggle dark mode"
        />
      }
    />
  )
}

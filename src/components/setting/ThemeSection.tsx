import { Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Switch } from "@/components/ui/switch"
import { SettingRow } from "./SettingRow"

export function ThemeSection() {
  const { theme, setTheme } = useTheme()

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const handleToggleDarkMode = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <SettingRow
      icon={<Moon className="size-3.5" />}
      title="Dark Mode"
      description="Toggle dark and light appearance."
      action={
        <Switch
          checked={isDarkMode}
          onCheckedChange={handleToggleDarkMode}
          aria-label="Toggle dark mode"
        />
      }
    />
  )
}

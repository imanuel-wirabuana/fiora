import type { MouseEvent } from "react"
import { Check, Palette, SunMoon } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { ThemeSection } from "@/components/setting"
import { useTheme } from "@/components/theme-provider"
import { APP_THEMES } from "@/lib/themes"
import { cn } from "@/lib/utils"
import type { AppThemeOption } from "@/types/theme"

export function AppAppearanceSettingScreen() {
  const { theme, appTheme, setAppTheme } = useTheme()

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const handleSelectTheme = (
    item: AppThemeOption,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (item.id === appTheme) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const origin =
      event.clientX !== 0 || event.clientY !== 0
        ? { x: event.clientX, y: event.clientY }
        : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

    setAppTheme(item.id, origin)
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <CustomItem
        icon={<SunMoon className="size-3.5 text-primary" />}
        title="Color Mode"
        contentClassName="flex flex-col gap-0.5"
      >
        <ThemeSection />
      </CustomItem>

      <CustomItem
        variant="soft"
        icon={<Palette className="size-3.5 text-primary" />}
        title="Themes"
        description="Choose a color palette and typography style for Fiora."
        contentClassName="flex flex-col gap-2.5 pt-1"
      >
        {APP_THEMES.map((item) => {
          const isSelected = appTheme === item.id
          const colors = isDarkMode ? item.preview.dark : item.preview.light

          return (
            <button
              key={item.id}
              type="button"
              onClick={(event) => handleSelectTheme(item, event)}
              aria-pressed={isSelected}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* Mini theme palette preview */}
                <div
                  className="flex h-10 w-12 shrink-0 flex-col justify-between rounded-lg border p-1.5 shadow-2xs"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.primary,
                  }}
                  aria-hidden="true"
                >
                  <div
                    className="h-2.5 w-full rounded-sm"
                    style={{ backgroundColor: colors.card }}
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {item.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-transparent text-transparent group-hover:border-primary/40"
                )}
              >
                <Check className="size-3" />
              </div>
            </button>
          )
        })}
      </CustomItem>
    </div>
  )
}

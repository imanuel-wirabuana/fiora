import type { AppThemeId, AppThemeOption } from "@/types/theme"

export const APP_THEMES: readonly AppThemeOption[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean neutral slate with warm coral-orange accents.",
    preview: {
      light: {
        background: "oklch(0.9846 0.0017 247.8389)",
        card: "oklch(1.0000 0 0)",
        primary: "oklch(0.6802 0.1902 32.0008)",
        secondary: "oklch(0.9394 0.0046 258.3251)",
        accent: "oklch(0.9204 0.0203 238.6791)",
        foreground: "oklch(0.2809 0 0)",
      },
      dark: {
        background: "oklch(0.2188 0.0148 248.5070)",
        card: "oklch(0.2617 0.0197 254.8441)",
        primary: "oklch(0.6802 0.1902 32.0008)",
        secondary: "oklch(0.2988 0.0207 257.2741)",
        accent: "oklch(0.3206 0.0396 254.6780)",
        foreground: "oklch(0.9189 0 0)",
      },
    },
  },
  {
    id: "nyoklat",
    name: "Nyoklat",
    description: "Warm golden amber paired with deep navy ink.",
    preview: {
      light: {
        background: "oklch(0.9386 0.0052 247.8792)",
        card: "oklch(1.0000 0 0)",
        primary: "oklch(0.7467 0.1415 79.3217)",
        secondary: "oklch(0.2090 0.0765 257.7247)",
        accent: "oklch(0.6072 0.0820 83.3943)",
        foreground: "oklch(0.2090 0.0765 257.7247)",
      },
      dark: {
        background: "oklch(0.2025 0.0543 264.7546)",
        card: "oklch(0.2762 0.0514 259.0249)",
        primary: "oklch(0.8713 0.1762 91.5322)",
        secondary: "oklch(0.5469 0.2507 262.8085)",
        accent: "oklch(0.6496 0.2362 26.9032)",
        foreground: "oklch(0.9837 0.0051 247.8759)",
      },
    },
  },
  {
    id: "burgundy",
    name: "Burgundy",
    description: "Rich wine tones with crisp editorial contrast.",
    preview: {
      light: {
        background: "oklch(0.9308 0.0084 337.4458)",
        card: "oklch(0.9700 0.0041 337.3514)",
        primary: "oklch(0.3708 0.1055 5.3345)",
        secondary: "oklch(0.8505 0.0198 344.0201)",
        accent: "oklch(0.4443 0.1268 5.8927)",
        foreground: "oklch(0.2105 0.0135 343.0384)",
      },
      dark: {
        background: "oklch(0.2972 0 0)",
        card: "oklch(0.3250 0 0)",
        primary: "oklch(0.3523 0 0)",
        secondary: "oklch(0.3092 0 0)",
        accent: "oklch(0.4054 0 0)",
        foreground: "oklch(0.7826 0 0)",
      },
    },
  },
  {
    id: "jandes",
    name: "Jandes",
    description: "Calm lavender mist with delicate rose highlights.",
    preview: {
      light: {
        background: "oklch(0.9777 0.0041 301.4256)",
        card: "oklch(1.0000 0 0)",
        primary: "oklch(0.6104 0.0767 299.7335)",
        secondary: "oklch(0.8957 0.0265 300.2416)",
        accent: "oklch(0.7889 0.0802 359.9375)",
        foreground: "oklch(0.3651 0.0325 287.0807)",
      },
      dark: {
        background: "oklch(0.2166 0.0215 292.8474)",
        card: "oklch(0.2544 0.0301 292.7315)",
        primary: "oklch(0.7058 0.0777 302.0489)",
        secondary: "oklch(0.4604 0.0472 295.5578)",
        accent: "oklch(0.3181 0.0321 308.6149)",
        foreground: "oklch(0.9053 0.0245 293.5570)",
      },
    },
  },
] as const

export const APP_THEME_IDS: readonly AppThemeId[] = APP_THEMES.map(
  (theme) => theme.id
)

export function isAppThemeId(value: string | null): value is AppThemeId {
  if (value === null) {
    return false
  }

  return APP_THEME_IDS.includes(value as AppThemeId)
}

export function getAppThemeById(id: AppThemeId): AppThemeOption {
  return APP_THEMES.find((theme) => theme.id === id) ?? APP_THEMES[0]
}


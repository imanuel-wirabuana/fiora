export type AppThemeId = "default" | "nyoklat" | "burgundy" | "jandes"

export interface AppThemePreviewColors {
  background: string
  card: string
  primary: string
  secondary: string
  accent: string
  foreground: string
}

export interface AppThemeOption {
  id: AppThemeId
  name: string
  description: string
  preview: {
    light: AppThemePreviewColors
    dark: AppThemePreviewColors
  }
}


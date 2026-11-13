import * as React from "react"
import { flushSync } from "react-dom"
import { isAppThemeId } from "@/lib/themes"
import type { AppThemeId } from "@/types/theme"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = "dark" | "light"
export type ThemeTransitionOrigin = { x: number; y: number }

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultAppTheme?: AppThemeId
  storageKey?: string
  appThemeStorageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme, origin?: ThemeTransitionOrigin) => void
  appTheme: AppThemeId
  setAppTheme: (appTheme: AppThemeId, origin?: ThemeTransitionOrigin) => void
}

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: Theme[] = ["dark", "light", "system"]

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false
  }

  return THEME_VALUES.includes(value as Theme)
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark"
  }

  return "light"
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const editableParent = target.closest(
    "input, textarea, select, [contenteditable='true']"
  )
  if (editableParent) {
    return true
  }

  return false
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAppTheme = "default",
  storageKey = "theme",
  appThemeStorageKey = "app-theme",
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    if (isTheme(storedTheme)) {
      return storedTheme
    }

    return defaultTheme
  })

  const [appTheme, setAppThemeState] = React.useState<AppThemeId>(() => {
    const storedAppTheme = localStorage.getItem(appThemeStorageKey)
    if (isAppThemeId(storedAppTheme)) {
      return storedAppTheme
    }

    return defaultAppTheme
  })

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement
      const resolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)

      if (restoreTransitions) {
        restoreTransitions()
      }
    },
    [disableTransitionOnChange]
  )

  const applyAppTheme = React.useCallback(
    (nextAppTheme: AppThemeId) => {
      const root = document.documentElement
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null

      if (nextAppTheme === "default") {
        root.removeAttribute("data-theme")
      } else {
        root.setAttribute("data-theme", nextAppTheme)
      }

      if (restoreTransitions) {
        restoreTransitions()
      }
    },
    [disableTransitionOnChange]
  )

  const runWithViewTransition = React.useCallback(
    (commitAndApply: () => void, origin?: ThemeTransitionOrigin) => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches

      if (
        typeof document.startViewTransition !== "function" ||
        prefersReducedMotion
      ) {
        commitAndApply()
        return
      }

      const x = origin?.x ?? window.innerWidth / 2
      const y = origin?.y ?? window.innerHeight / 2
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = document.startViewTransition(() => {
        flushSync(commitAndApply)
      })

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 450,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
        .catch(() => {
          // Ignore aborted transitions when toggled rapidly
        })
    },
    []
  )

  const setTheme = React.useCallback(
    (nextTheme: Theme, origin?: ThemeTransitionOrigin) => {
      runWithViewTransition(() => {
        localStorage.setItem(storageKey, nextTheme)
        setThemeState(nextTheme)
        applyTheme(nextTheme)
      }, origin)
    },
    [applyTheme, runWithViewTransition, storageKey]
  )

  const setAppTheme = React.useCallback(
    (nextAppTheme: AppThemeId, origin?: ThemeTransitionOrigin) => {
      runWithViewTransition(() => {
        localStorage.setItem(appThemeStorageKey, nextAppTheme)
        setAppThemeState(nextAppTheme)
        applyAppTheme(nextAppTheme)
      }, origin)
    },
    [appThemeStorageKey, applyAppTheme, runWithViewTransition]
  )

  React.useEffect(() => {
    applyAppTheme(appTheme)
  }, [appTheme, applyAppTheme])

  React.useEffect(() => {
    applyTheme(theme)

    if (theme !== "system") {
      return undefined
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      applyTheme("system")
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, applyTheme])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      const nextTheme =
        theme === "dark"
          ? "light"
          : theme === "light"
            ? "dark"
            : getSystemTheme() === "dark"
              ? "light"
              : "dark"

      setTheme(nextTheme)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [setTheme, theme])

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key === storageKey) {
        if (isTheme(event.newValue)) {
          setThemeState(event.newValue)
          return
        }

        setThemeState(defaultTheme)
        return
      }

      if (event.key === appThemeStorageKey) {
        if (isAppThemeId(event.newValue)) {
          setAppThemeState(event.newValue)
          return
        }

        setAppThemeState(defaultAppTheme)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [appThemeStorageKey, defaultAppTheme, defaultTheme, storageKey])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      appTheme,
      setAppTheme,
    }),
    [theme, setTheme, appTheme, setAppTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}

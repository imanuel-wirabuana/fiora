import { createContext, useContext } from "react"

/**
 * Tracks whether the enclosing tab pane is currently active/visible.
 * Defaults to `true` so standalone screens outside a tab pager stay active.
 */
export const TabPaneContext = createContext<boolean>(true)

export function useTabPaneActive(): boolean {
  return useContext(TabPaneContext)
}

/**
 * Tracks whether the enclosing UI lives inside a drawer so its own
 * animations are not paused by `activeDrawerCount > 0`.
 */
export const DrawerScopeContext = createContext<boolean>(false)

export function useIsInsideDrawer(): boolean {
  return useContext(DrawerScopeContext)
}

import { create } from "zustand"

const DRAWER_SETTLE_MS = 460

let drawerSettleTimer: ReturnType<typeof setTimeout> | null = null

function clearDrawerSettleTimer() {
  if (drawerSettleTimer !== null) {
    clearTimeout(drawerSettleTimer)
    drawerSettleTimer = null
  }
}

export interface AnimationStoreState {
  isTabSliding: boolean
  activeDrawerCount: number
  isDrawerSettling: boolean
  isDragging: boolean
  isPageHidden: boolean
  setTabSliding: (sliding: boolean) => void
  incrementDrawer: () => void
  decrementDrawer: () => void
  setDragging: (dragging: boolean) => void
  setPageHidden: (hidden: boolean) => void
}

/**
 * Global coordination store for pausing heavy Lottie animations during
 * transient UI transitions (tab swipes, open/closing drawers, drag-and-drop,
 * or backgrounded browser tabs).
 */
export const useAnimationStore = create<AnimationStoreState>((set) => ({
  isTabSliding: false,
  activeDrawerCount: 0,
  isDrawerSettling: false,
  isDragging: false,
  isPageHidden:
    typeof document !== "undefined"
      ? document.visibilityState === "hidden"
      : false,

  setTabSliding: (isTabSliding) => set({ isTabSliding }),

  incrementDrawer: () => {
    clearDrawerSettleTimer()
    set((state) => ({
      activeDrawerCount: state.activeDrawerCount + 1,
      isDrawerSettling: false,
    }))
  },

  decrementDrawer: () => {
    clearDrawerSettleTimer()
    set((state) => ({
      activeDrawerCount: Math.max(0, state.activeDrawerCount - 1),
      isDrawerSettling: true,
    }))
    drawerSettleTimer = setTimeout(() => {
      drawerSettleTimer = null
      useAnimationStore.setState({ isDrawerSettling: false })
    }, DRAWER_SETTLE_MS)
  },

  setDragging: (isDragging) => set({ isDragging }),

  setPageHidden: (isPageHidden) => set({ isPageHidden }),
}))

/**
 * Returns true whenever any global animation pause condition is active.
 */
export function useIsAnimationsPaused(ignoreDrawerPause = false): boolean {
  return useAnimationStore(
    (state) =>
      state.isTabSliding ||
      (!ignoreDrawerPause && state.activeDrawerCount > 0) ||
      state.isDrawerSettling ||
      state.isDragging ||
      state.isPageHidden
  )
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    useAnimationStore
      .getState()
      .setPageHidden(document.visibilityState === "hidden")
  })
}

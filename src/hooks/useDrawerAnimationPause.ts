import { useEffect } from "react"
import { useAnimationStore } from "@/stores/animationStore"

/**
 * Pauses background animations while a drawer is open and during its close settle window.
 */
export function useDrawerAnimationPause(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return
    useAnimationStore.getState().incrementDrawer()
    return () => {
      useAnimationStore.getState().decrementDrawer()
    }
  }, [isOpen])
}

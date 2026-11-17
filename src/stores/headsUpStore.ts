import { create } from "zustand"
import type { NotificationRecord } from "../types/notification"

const HEADS_UP_DURATION_MS = 4000

let dismissTimer: ReturnType<typeof setTimeout> | null = null

function clearDismissTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

export interface HeadsUpItem {
  id: string | number
  title: string
  body?: string
  emoji?: string
  type?: string
  url?: string
  notification?: NotificationRecord
}

interface HeadsUpStoreState {
  active: HeadsUpItem | null
  show: (item: HeadsUpItem) => void
  dismiss: () => void
}

export const useHeadsUpStore = create<HeadsUpStoreState>((set) => ({
  active: null,

  show: (item) => {
    clearDismissTimer()
    set({ active: item })
    dismissTimer = setTimeout(() => {
      dismissTimer = null
      set({ active: null })
    }, HEADS_UP_DURATION_MS)
  },

  dismiss: () => {
    clearDismissTimer()
    set({ active: null })
  },
}))

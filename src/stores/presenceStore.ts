import { create } from "zustand"
import type { PartnerPresenceState } from "../types/presence"

interface PresenceStoreState {
  partnerPresence: PartnerPresenceState | null
  lastDisconnectedAt: string | null
  customActivityOverride: string | null
  setPartnerPresence: (presence: PartnerPresenceState | null) => void
  setLastDisconnectedAt: (timestamp: string | null) => void
  setCustomActivityOverride: (activity: string | null) => void
  resetPresence: () => void
}

export const usePresenceStore = create<PresenceStoreState>((set) => ({
  partnerPresence: null,
  lastDisconnectedAt: null,
  customActivityOverride: null,

  setPartnerPresence: (partnerPresence) => set({ partnerPresence }),
  setLastDisconnectedAt: (lastDisconnectedAt) => set({ lastDisconnectedAt }),
  setCustomActivityOverride: (customActivityOverride) =>
    set({ customActivityOverride }),
  resetPresence: () =>
    set({
      partnerPresence: null,
      lastDisconnectedAt: null,
      customActivityOverride: null,
    }),
}))


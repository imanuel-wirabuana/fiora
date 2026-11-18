import { create } from "zustand"
import { PET_PARTICLE_CONFIG } from "@/lib/petConfig"

export interface EmojiParticle {
  id: number
  emoji: string
  x: number
  y: number
  dx: number
  dy: number
  sizeClass: string
  rotate: number
  duration: number
}

let nextParticleId = 1

export interface DraggingCareItem {
  mode: "eat" | "bath"
  emoji: string
  x: number
  y: number
}

interface PetUIState {
  /** Emoji burst shown briefly when an activity completes */
  celebrationEmoji: string | null
  /** Interactive activity progress (0-100) for Eat & Bath */
  interactionProgress: number
  /** Currently open care drawer ("eat" | null) */
  activeCareDrawer: "eat" | null
  /** Floating item currently being dragged from a care drawer onto the stage */
  draggingItem: DraggingCareItem | null
  /** Whether a dragged item is currently over/near the pet */
  isNearPet: boolean
  /** Brief chewing animation state after dropping food */
  isChewing: boolean
  /** Brief happy petting state when tapping/rubbing idle pet */
  isPetting: boolean
  /** Horizontal lean (-1 to 1) toward dragged object */
  petLeanX: number
  /** Active emoji particles on stage */
  particles: EmojiParticle[]

  triggerCelebration: (emoji: string) => void
  clearCelebration: () => void
  setInteractionProgress: (progress: number) => void
  addInteractionProgress: (delta: number) => number
  setActiveCareDrawer: (mode: "eat" | null) => void
  startDraggingItem: (item: DraggingCareItem) => void
  updateDraggingItem: (x: number, y: number) => void
  stopDraggingItem: () => void
  setNearPet: (near: boolean) => void
  setChewing: (chewing: boolean) => void
  setPetting: (petting: boolean) => void
  setPetLeanX: (leanX: number) => void
  spawnParticles: (
    emojis: string[],
    count?: number,
    origin?: { x: number; y: number }
  ) => void
  removeParticle: (id: number) => void
  resetInteractionState: () => void
}

export const usePetStore = create<PetUIState>((set, get) => ({
  celebrationEmoji: null,
  interactionProgress: 0,
  activeCareDrawer: null,
  draggingItem: null,
  isNearPet: false,
  isChewing: false,
  isPetting: false,
  petLeanX: 0,
  particles: [],

  triggerCelebration: (emoji) => set({ celebrationEmoji: emoji }),
  clearCelebration: () => set({ celebrationEmoji: null }),
  setInteractionProgress: (progress) =>
    set({ interactionProgress: Math.max(0, Math.min(100, progress)) }),
  addInteractionProgress: (delta) => {
    const next = Math.max(0, Math.min(100, get().interactionProgress + delta))
    set({ interactionProgress: next })
    return next
  },
  setActiveCareDrawer: (activeCareDrawer) => set({ activeCareDrawer }),
  startDraggingItem: (draggingItem) =>
    set({ draggingItem, activeCareDrawer: null }),
  updateDraggingItem: (x, y) =>
    set((state) =>
      state.draggingItem ? { draggingItem: { ...state.draggingItem, x, y } } : {}
    ),
  stopDraggingItem: () =>
    set({ draggingItem: null, isNearPet: false, petLeanX: 0 }),
  setNearPet: (isNearPet) => set({ isNearPet }),
  setChewing: (isChewing) => set({ isChewing }),
  setPetting: (isPetting) => set({ isPetting }),
  setPetLeanX: (petLeanX) =>
    set({ petLeanX: Math.max(-1, Math.min(1, petLeanX)) }),

  spawnParticles: (emojis, count = 6, origin = { x: 0, y: 0 }) => {
    const created: EmojiParticle[] = Array.from({ length: count }, () => ({
      id: nextParticleId++,
      emoji: emojis[Math.floor(Math.random() * emojis.length)] ?? "✨",
      x: origin.x + (Math.random() - 0.5) * 44,
      y: origin.y + (Math.random() - 0.5) * 32,
      dx: (Math.random() - 0.5) * 140,
      dy: -45 - Math.random() * 95,
      sizeClass:
        PET_PARTICLE_CONFIG.sizeClasses[
          Math.floor(Math.random() * PET_PARTICLE_CONFIG.sizeClasses.length)
        ] ?? "text-xl",
      rotate: (Math.random() - 0.5) * 80,
      duration: 0.75 + Math.random() * 0.6,
    }))

    set((state) => ({
      particles: [
        ...state.particles.slice(-PET_PARTICLE_CONFIG.maxActive),
        ...created,
      ],
    }))
  },

  removeParticle: (id) =>
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
    })),

  resetInteractionState: () =>
    set({
      interactionProgress: 0,
      activeCareDrawer: null,
      draggingItem: null,
      isNearPet: false,
      isChewing: false,
      petLeanX: 0,
    }),
}))

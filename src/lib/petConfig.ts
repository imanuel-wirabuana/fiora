import type {
  PetActivityType,
  PetCosmeticSlot,
  PetCosmeticTransform,
  PetMinigameId,
  PetStatKey,
  PetStats,
  PetWearableSlot,
} from "@/types/pet"
import { PET_ROOM_THEMES } from "./petRooms"

export interface PetActivityInteractionConfig {
  progressStep: number
  cooldownMs?: number
  completeDelayMs: number
}

export interface PetActivityConfig {
  type: PetActivityType
  icon: string
  tint: string
  emojis: string[]
  statDeltas: Partial<PetStats>
  xpReward: number
  cancellable: boolean
  interaction?: PetActivityInteractionConfig
}

export interface PetStatConfig {
  key: PetStatKey
  emoji: string
  barClass: string
  initialValue: number
}

export const PET_PROFILE_CONFIG = {
  initialXp: 0,
  nameMaxLength: 24,
} as const

export const PET_LEVEL_CONFIG = {
  /** Quadratic XP scale: totalXp(level) = xpScale * (level - 1)^2 (1000 XP => Lv. 5) */
  xpScale: 60,
  /** Maximum reachable level */
  maxLevel: 100,
} as const

export const PET_STATS_CONFIG: Record<PetStatKey, PetStatConfig> = {
  hunger: {
    key: "hunger",
    emoji: "🍎",
    barClass: "[&_[data-slot=progress-indicator]]:bg-amber-400",
    initialValue: 70,
  },
  happiness: {
    key: "happiness",
    emoji: "💛",
    barClass: "[&_[data-slot=progress-indicator]]:bg-pink-400",
    initialValue: 70,
  },
  energy: {
    key: "energy",
    emoji: "⚡",
    barClass: "[&_[data-slot=progress-indicator]]:bg-sky-400",
    initialValue: 70,
  },
  hygiene: {
    key: "hygiene",
    emoji: "🫧",
    barClass: "[&_[data-slot=progress-indicator]]:bg-emerald-400",
    initialValue: 70,
  },
}

export const PET_STAT_LIST: PetStatConfig[] = Object.values(PET_STATS_CONFIG)

export function getInitialPetStats(): PetStats {
  return {
    hunger: PET_STATS_CONFIG.hunger.initialValue,
    happiness: PET_STATS_CONFIG.happiness.initialValue,
    energy: PET_STATS_CONFIG.energy.initialValue,
    hygiene: PET_STATS_CONFIG.hygiene.initialValue,
  }
}

export const PET_STAT_THRESHOLDS = {
  /** Below this value, the stat percentage turns destructive/red in UI */
  lowWarning: 25,
  /** Minimum energy required to play minigames */
  minEnergyToPlay: 20,
  /** Stat below this triggers critical visual (shaking/melting/angry/sick) */
  criticalMin: 20,
  /** Hunger above this triggers chubby/overfed visual */
  overfedHunger: 100,
  /** Energy below this triggers sleepy expression */
  sleepyEnergy: 35,
  /** Minimum stat below this triggers sad expression */
  sadMin: 40,
  /** Average stat at or above this triggers happy expression */
  happyAvg: 75,
} as const

export const PET_SIZE_CONFIG = {
  /** Pet avatar size in px at level 1 */
  baseSizePx: 120,
  /** Maximum pet avatar size in px at maxLevel (almost entire mobile screen) */
  maxSizePx: 380,
} as const

export const PET_ACTIVITIES: Record<PetActivityType, PetActivityConfig> = {
  eat: {
    type: "eat",
    icon: "🍎",
    tint: "bg-amber-50 hover:bg-amber-100/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    emojis: ["🍎", "🍕", "🥕", "🍔", "🍓", "🍪", "🍣", "🧁"],
    statDeltas: { hunger: 33, happiness: 2, hygiene: -2 },
    xpReward: 3,
    cancellable: true,
    interaction: {
      progressStep: 25,
      completeDelayMs: 450,
    },
  },
  play: {
    type: "play",
    icon: "🎮",
    tint: "bg-pink-50 hover:bg-pink-100/80 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200",
    emojis: ["🍎", "🔮", "🐦"],
    statDeltas: { happiness: 50, energy: -1.5, hunger: -3, hygiene: -2 },
    xpReward: 4,
    cancellable: true,
  },
  bath: {
    type: "bath",
    icon: "🧼",
    tint: "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    emojis: ["🧼", "🫧", "💦"],
    statDeltas: { hygiene: 33, happiness: 2 },
    xpReward: 3,
    cancellable: true,
    interaction: {
      progressStep: 8,
      cooldownMs: 160,
      completeDelayMs: 350,
    },
  },
  sleep: {
    type: "sleep",
    icon: "🛏️",
    tint: "bg-sky-50 hover:bg-sky-100/80 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    emojis: ["🛏️", "💤"],
    statDeltas: {},
    xpReward: 5,
    cancellable: true,
  },
}

export const PET_ACTIVITY_LIST: PetActivityConfig[] =
  Object.values(PET_ACTIVITIES)

export const PET_STAGE_CONFIG = {
  hitRadiusPx: 95,
  durationsMs: {
    petting: 650,
    chewing: 750,
    sleepParticles: 1100,
    celebrationClear: 1400,
  },
} as const

export const PET_PARTICLE_CONFIG = {
  maxActive: 24,
  sizeClasses: ["text-sm", "text-lg", "text-2xl", "text-3xl", "text-4xl"],
} as const

export interface PetMinigameConfig {
  id: PetMinigameId
  icon: string
  /** Starting hearts for life-based games */
  initialLives?: number
  tint: string
  /** Score at which sqrt-scaled rewards reach their cap */
  targetScore: number
  /** Stable reward ranges (interpolated via sqrt(score / targetScore)) */
  rewards: {
    baseXp: number
    maxBonusXp: number
    baseHappiness: number
    maxBonusHappiness: number
    baseEnergyCost: number
    maxExtraEnergyCost: number
    baseHungerCost: number
    maxExtraHungerCost: number
  }
}

const DEFAULT_MINIGAME_REWARDS = {
  baseXp: 3,
  maxBonusXp: 7,
  baseHappiness: 3,
  maxBonusHappiness: 11,
  baseEnergyCost: 2,
  maxExtraEnergyCost: 5,
  baseHungerCost: 1,
  maxExtraHungerCost: 3,
} as const

export const PET_MINIGAMES: Record<PetMinigameId, PetMinigameConfig> = {
  "fruit-catcher": {
    id: "fruit-catcher",
    icon: "🍎",
    initialLives: 3,
    tint: "bg-amber-50 hover:bg-amber-100/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    targetScore: 250,
    rewards: { ...DEFAULT_MINIGAME_REWARDS },
  },
  zuma: {
    id: "zuma",
    icon: "🔮",
    tint: "bg-sky-50 hover:bg-sky-100/80 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    targetScore: 400,
    rewards: { ...DEFAULT_MINIGAME_REWARDS },
  },
  "flappy-pet": {
    id: "flappy-pet",
    icon: "🐦",
    tint: "bg-pink-50 hover:bg-pink-100/80 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200",
    targetScore: 20,
    rewards: { ...DEFAULT_MINIGAME_REWARDS },
  },
}

export const PET_MINIGAME_LIST: PetMinigameConfig[] =
  Object.values(PET_MINIGAMES)

export interface PetCosmeticItem {
  id: string
  emoji: string
  unlockLevel: number
  /** Background gradient classes for "room" slot */
  stageClass?: string
}

export const PET_COSMETIC_SLOTS: Array<{
  slot: PetCosmeticSlot
  tint: string
}> = [
  {
    slot: "room",
    tint: "bg-violet-50 hover:bg-violet-100/80 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  },
  {
    slot: "headwear",
    tint: "bg-amber-50 hover:bg-amber-100/80 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  {
    slot: "facewear",
    tint: "bg-sky-50 hover:bg-sky-100/80 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  },
  {
    slot: "clothes",
    tint: "bg-rose-50 hover:bg-rose-100/80 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  },
]

export const PET_COSMETIC_ITEMS: Record<PetCosmeticSlot, PetCosmeticItem[]> = {
  room: PET_ROOM_THEMES.map((room) => ({
    id: room.id,
    emoji: room.signatureEmoji,
    unlockLevel: room.unlockLevel,
    stageClass: room.background,
  })),
  headwear: [
    { id: "cap", emoji: "🧢", unlockLevel: 10 },
    { id: "ribbon", emoji: "🎀", unlockLevel: 20 },
    { id: "sunhat", emoji: "👒", unlockLevel: 30 },
    { id: "hairpick", emoji: "🪮", unlockLevel: 40 },
    { id: "rescue-helmet", emoji: "⛑️", unlockLevel: 50 },
    { id: "military-helmet", emoji: "🪖", unlockLevel: 60 },
    { id: "gradcap", emoji: "🎓", unlockLevel: 70 },
    { id: "tophat", emoji: "🎩", unlockLevel: 80 },
    { id: "candle", emoji: "🕯️", unlockLevel: 90 },
    { id: "crown", emoji: "👑", unlockLevel: 100 },
  ],
  facewear: [
    { id: "plaster", emoji: "🩹", unlockLevel: 10 },
    { id: "glasses", emoji: "👓", unlockLevel: 20 },
    { id: "droplet", emoji: "💧", unlockLevel: 30 },
    { id: "anger", emoji: "💢", unlockLevel: 40 },
    { id: "kiss", emoji: "💋", unlockLevel: 50 },
    { id: "sunglasses", emoji: "🕶️", unlockLevel: 60 },
    { id: "dizzy", emoji: "💫", unlockLevel: 70 },
    { id: "boom", emoji: "💥", unlockLevel: 80 },
    { id: "cigarette", emoji: "🚬", unlockLevel: 90 },
    { id: "sax", emoji: "🎷", unlockLevel: 100 },
  ],
  clothes: [
    { id: "tshirt", emoji: "👕", unlockLevel: 10 },
    { id: "shorts", emoji: "🩳", unlockLevel: 20 },
    { id: "singlet", emoji: "🎽", unlockLevel: 30 },
    { id: "jeans", emoji: "👖", unlockLevel: 40 },
    { id: "vest", emoji: "🦺", unlockLevel: 50 },
    { id: "coat", emoji: "🧥", unlockLevel: 60 },
    { id: "labcoat", emoji: "🥼", unlockLevel: 70 },
    { id: "martial", emoji: "🥋", unlockLevel: 80 },
    { id: "briefs", emoji: "🩲", unlockLevel: 90 },
    { id: "bikini", emoji: "👙", unlockLevel: 100 },
  ],
}

export const PET_COSMETIC_TRANSFORM_CONFIG: {
  minOffset: number
  maxOffset: number
  minScale: number
  maxScale: number
  scaleStep: number
  minRotate: number
  maxRotate: number
  defaults: Record<PetWearableSlot, PetCosmeticTransform>
} = {
  minOffset: -0.75,
  maxOffset: 0.75,
  minScale: 0.4,
  maxScale: 2.5,
  scaleStep: 0.1,
  minRotate: -180,
  maxRotate: 180,
  defaults: {
    headwear: { x: 0, y: -0.46, scaleX: 1, scaleY: 1, rotate: 0 },
    facewear: { x: 0, y: -0.04, scaleX: 1, scaleY: 1, rotate: 0 },
    clothes: { x: 0, y: 0.34, scaleX: 1, scaleY: 1, rotate: 0 },
  },
}

export type PetStatKey = "hunger" | "happiness" | "energy" | "hygiene"

export interface PetStats {
  hunger: number
  happiness: number
  energy: number
  hygiene: number
}

export type PetActivityType = "eat" | "play" | "bath" | "sleep"

export type PetMinigameId = "fruit-catcher" | "zuma" | "flappy-pet"

export type PetCosmeticSlot =
  | "room"
  | "headwear"
  | "facewear"
  | "clothes"
  | "footwear"

export type PetWearableSlot = Exclude<PetCosmeticSlot, "room">

export interface PetCosmeticTransform {
  /** Horizontal offset relative to pet size */
  x: number
  /** Vertical offset relative to pet size */
  y: number
  /** Legacy uniform scale multiplier */
  scale?: number
  /** Horizontal stretch multiplier */
  scaleX?: number
  /** Vertical stretch multiplier */
  scaleY?: number
  /** Tilt/rotation in degrees (-180 to 180) */
  rotate?: number
}

export interface PetCosmetics {
  room: string | null
  headwear: string | null
  facewear: string | null
  clothes: string | null
  footwear: string | null
}

export interface ActivePetActivity {
  type: PetActivityType
  startedAt: string
  emoji: string
}

export interface PetContent {
  /** Total cumulative XP; pet level is derived from this value */
  xp: number
  stats: PetStats
  lastUpdatedAt: string
  activeActivity: ActivePetActivity | null
  isSleeping?: boolean
  sleep_at?: string | null
  lastAteAt?: string | null
  cosmetics?: PetCosmetics
  cosmeticTransforms?: Partial<Record<PetWearableSlot, PetCosmeticTransform>>
  highScores?: Partial<Record<PetMinigameId, number>>
}

export interface Pet {
  id: number
  relationship_id: number
  name: string
  unique_name: string
  content: PetContent | null
  created_at: string
  updated_at: string | null
}

export interface CreatePetInput {
  relationshipId: number
  name: string
  content: PetContent
}

export interface UpdatePetInput {
  id: number
  name?: string
  content: PetContent
}

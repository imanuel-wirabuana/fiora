import {
  happy,
  idle,
  love,
  mad,
  sad,
  shy,
  sick,
  sleepy,
  surprised,
} from "blobatar/expression"
import type {
  ActivePetActivity,
  PetActivityType,
  PetContent,
  PetCosmeticSlot,
  PetCosmeticTransform,
  PetCosmetics,
  PetMinigameId,
  PetStats,
  PetWearableSlot,
} from "@/types/pet"
import {
  PET_ACTIVITIES,
  PET_COSMETIC_ITEMS,
  PET_COSMETIC_TRANSFORM_CONFIG,
  PET_LEVEL_CONFIG,
  PET_MINIGAMES,
  PET_PROFILE_CONFIG,
  PET_SIZE_CONFIG,
  PET_STAT_THRESHOLDS,
  getInitialPetStats,
  type PetCosmeticItem,
} from "./petConfig"

export const DEFAULT_PET_COSMETICS: PetCosmetics = {
  room: null,
  headwear: null,
  facewear: null,
  clothes: null,
  footwear: null,
}

export function clampCosmeticTransform(
  transform: PetCosmeticTransform
): PetCosmeticTransform {
  const { minOffset, maxOffset, minScale, maxScale, minRotate, maxRotate } =
    PET_COSMETIC_TRANSFORM_CONFIG
  const clampNum = (v: number, min: number, max: number) =>
    Math.round(Math.max(min, Math.min(max, v)) * 100) / 100
  const fallbackScale = transform.scale ?? 1
  const rawRotate = transform.rotate ?? 0
  const clampedRotate = Math.round(
    Math.max(minRotate, Math.min(maxRotate, rawRotate))
  )
  return {
    x: clampNum(transform.x, minOffset, maxOffset),
    y: clampNum(transform.y, minOffset, maxOffset),
    scaleX: clampNum(transform.scaleX ?? fallbackScale, minScale, maxScale),
    scaleY: clampNum(transform.scaleY ?? fallbackScale, minScale, maxScale),
    rotate: clampedRotate,
  }
}

export function getCosmeticTransform(
  content: PetContent,
  slot: PetWearableSlot
): PetCosmeticTransform {
  const custom = content.cosmeticTransforms?.[slot]
  if (!custom) return PET_COSMETIC_TRANSFORM_CONFIG.defaults[slot]
  return clampCosmeticTransform(custom)
}

export function getCosmeticItem(
  slot: PetCosmeticSlot,
  itemId: string | null | undefined
): PetCosmeticItem | null {
  if (!itemId) return null
  return PET_COSMETIC_ITEMS[slot].find((item) => item.id === itemId) ?? null
}

export function getPetSizeForLevel(level: number): number {
  const maxLevel = PET_LEVEL_CONFIG.maxLevel ?? 100
  const safeLevel = Math.max(1, Math.min(maxLevel, Math.floor(level)))
  if (maxLevel <= 1) return PET_SIZE_CONFIG.baseSizePx
  const progress = (safeLevel - 1) / (maxLevel - 1)
  return Math.round(
    PET_SIZE_CONFIG.baseSizePx +
      progress * (PET_SIZE_CONFIG.maxSizePx - PET_SIZE_CONFIG.baseSizePx)
  )
}

export function canPetPlay(content: PetContent): boolean {
  return content.stats.energy >= PET_STAT_THRESHOLDS.minEnergyToPlay
}

export function getTotalXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level))
  return PET_LEVEL_CONFIG.xpScale * Math.pow(safeLevel - 1, 2)
}

export function getLevelFromXp(totalXp: number): number {
  const safeXp = Math.max(0, Number.isFinite(totalXp) ? totalXp : 0)
  const rawLevel = Math.floor(Math.sqrt(safeXp / PET_LEVEL_CONFIG.xpScale)) + 1
  return PET_LEVEL_CONFIG.maxLevel !== null
    ? Math.min(PET_LEVEL_CONFIG.maxLevel, rawLevel)
    : rawLevel
}

export function getPetLevelProgress(totalXp: number): {
  level: number
  totalXp: number
  currentLevelXp: number
  nextLevelXp: number
  xpIntoLevel: number
  xpNeededForNext: number
  progressPct: number
  isMaxLevel: boolean
} {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0))
  const level = getLevelFromXp(safeXp)
  const isMaxLevel =
    PET_LEVEL_CONFIG.maxLevel !== null && level >= PET_LEVEL_CONFIG.maxLevel
  const currentLevelXp = getTotalXpForLevel(level)
  const nextLevelXp = isMaxLevel
    ? currentLevelXp
    : getTotalXpForLevel(level + 1)
  const xpIntoLevel = Math.max(0, safeXp - currentLevelXp)
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelXp)
  const progressPct = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100))

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForNext,
    progressPct,
    isMaxLevel,
  }
}

export function addPetXp(currentXp: number, reward: number): number {
  const safeCurrent = Math.max(
    0,
    Math.floor(Number.isFinite(currentXp) ? currentXp : 0)
  )
  const safeReward = Math.max(
    0,
    Math.round(Number.isFinite(reward) ? reward : 0)
  )
  return safeCurrent + safeReward
}

/** Clamps between 0 and maxOverlimit (125) with 0.01 precision */
export function clampStat(value: number): number {
  return Math.max(
    0,
    Math.min(PET_STAT_THRESHOLDS.maxOverlimit, Math.round(value * 100) / 100)
  )
}

export function formatStatValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function createInitialPetContent(now = Date.now()): PetContent {
  return {
    xp: PET_PROFILE_CONFIG.initialXp,
    stats: getInitialPetStats(),
    lastUpdatedAt: new Date(now).toISOString(),
    activeActivity: null,
    isSleeping: false,
    sleep_at: null,
    lastAteAt: null,
    cosmetics: { ...DEFAULT_PET_COSMETICS },
  }
}

export function normalizePetContent(
  content: PetContent | null | undefined
): PetContent {
  if (!content) return createInitialPetContent()

  // Migrate legacy records that stored a separate `level` alongside per-level `xp`
  const legacy = content as PetContent & { level?: number }
  const { level: legacyLevel, ...rest } = legacy
  const rawXp = Math.max(
    0,
    Math.floor(Number.isFinite(content.xp) ? content.xp : 0)
  )
  const cumulativeXp =
    typeof legacyLevel === "number" &&
    Number.isFinite(legacyLevel) &&
    legacyLevel > 1
      ? Math.max(rawXp, getTotalXpForLevel(legacyLevel) + rawXp)
      : rawXp

  return {
    ...rest,
    xp: cumulativeXp,
    stats: {
      hunger: clampStat(content.stats.hunger),
      happiness: clampStat(content.stats.happiness),
      energy: clampStat(content.stats.energy),
      hygiene: clampStat(content.stats.hygiene),
    },
    isSleeping: Boolean(content.isSleeping),
    sleep_at: content.sleep_at ?? null,
    lastAteAt: content.lastAteAt ?? null,
    cosmetics: {
      room: content.cosmetics?.room ?? null,
      headwear: content.cosmetics?.headwear ?? null,
      facewear: content.cosmetics?.facewear ?? null,
      clothes: content.cosmetics?.clothes ?? null,
      footwear: content.cosmetics?.footwear ?? null,
    },
    cosmeticTransforms: content.cosmeticTransforms
      ? {
          ...(content.cosmeticTransforms.headwear
            ? {
                headwear: clampCosmeticTransform(
                  content.cosmeticTransforms.headwear
                ),
              }
            : {}),
          ...(content.cosmeticTransforms.facewear
            ? {
                facewear: clampCosmeticTransform(
                  content.cosmeticTransforms.facewear
                ),
              }
            : {}),
          ...(content.cosmeticTransforms.clothes
            ? {
                clothes: clampCosmeticTransform(
                  content.cosmeticTransforms.clothes
                ),
              }
            : {}),
          ...(content.cosmeticTransforms.footwear
            ? {
                footwear: clampCosmeticTransform(
                  content.cosmeticTransforms.footwear
                ),
              }
            : {}),
        }
      : undefined,
  }
}

export function pickActivityEmoji(type: PetActivityType): string {
  const pool = PET_ACTIVITIES[type].emojis
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]
}

export function applyStatDeltas(
  stats: PetStats,
  deltas: Partial<PetStats>
): PetStats {
  return {
    hunger: clampStat(stats.hunger + (deltas.hunger ?? 0)),
    happiness: clampStat(stats.happiness + (deltas.happiness ?? 0)),
    energy: clampStat(stats.energy + (deltas.energy ?? 0)),
    hygiene: clampStat(stats.hygiene + (deltas.hygiene ?? 0)),
  }
}

export function completeActivityNow(
  content: PetContent,
  now = Date.now()
): { content: PetContent; completedActivity: ActivePetActivity | null } {
  const active = content.activeActivity
  if (!active) {
    return { content, completedActivity: null }
  }
  const config = PET_ACTIVITIES[active.type]
  const nextStats = applyStatDeltas(content.stats, config.statDeltas)
  const nextXp = addPetXp(content.xp, config.xpReward)

  return {
    content: {
      ...content,
      xp: nextXp,
      stats: nextStats,
      lastUpdatedAt: new Date(now).toISOString(),
      activeActivity: null,
    },
    completedActivity: active,
  }
}

function getMinigameScoreRatio(gameId: PetMinigameId, score: number): number {
  const game = PET_MINIGAMES[gameId]
  const safeScore = Math.max(0, Math.floor(score))
  return Math.min(1, Math.sqrt(safeScore / Math.max(1, game.targetScore)))
}

export function calculateMinigameXp(
  gameId: PetMinigameId,
  score: number
): number {
  const { baseXp, maxBonusXp } = PET_MINIGAMES[gameId].rewards
  const ratio = getMinigameScoreRatio(gameId, score)
  return baseXp + Math.round(maxBonusXp * ratio)
}

export function calculateMinigameStatDeltas(
  gameId: PetMinigameId,
  score: number
): Partial<PetStats> {
  const r = PET_MINIGAMES[gameId].rewards
  const ratio = getMinigameScoreRatio(gameId, score)
  const happiness = r.baseHappiness + Math.round(r.maxBonusHappiness * ratio)
  const energyCost = r.baseEnergyCost + Math.round(r.maxExtraEnergyCost * ratio)
  const hungerCost = r.baseHungerCost + Math.round(r.maxExtraHungerCost * ratio)
  return {
    happiness,
    energy: -energyCost,
    hunger: -hungerCost,
  }
}

export function applyMinigameReward(
  content: PetContent,
  gameId: PetMinigameId,
  score: number,
  now = Date.now()
): {
  content: PetContent
  earnedXp: number
  statDeltas: Partial<PetStats>
  isNewBest: boolean
  bestScore: number
} {
  const safeScore = Math.max(0, Math.floor(score))
  const earnedXp = calculateMinigameXp(gameId, safeScore)
  const statDeltas = calculateMinigameStatDeltas(gameId, safeScore)
  const nextStats = applyStatDeltas(content.stats, statDeltas)
  const nextXp = addPetXp(content.xp, earnedXp)

  const prevBest = content.highScores?.[gameId] ?? 0
  const isNewBest = safeScore > prevBest
  const bestScore = Math.max(prevBest, safeScore)

  return {
    content: {
      ...content,
      xp: nextXp,
      stats: nextStats,
      lastUpdatedAt: new Date(now).toISOString(),
      activeActivity: null,
      highScores: {
        ...(content.highScores ?? {}),
        [gameId]: bestScore,
      },
    },
    earnedXp,
    statDeltas,
    isNewBest,
    bestScore,
  }
}

export interface PetConditionVisuals {
  isStarving: boolean
  isOverfed: boolean
  overfedScaleX: number
  overfedScaleY: number
  isMelting: boolean
  isAngry: boolean
  /** 0: clean (75%+), 1: 50-74%, 2: 25-49%, 3: <25% */
  dirtyTier: 0 | 1 | 2 | 3
}

export function getPetConditionVisuals(stats: PetStats): PetConditionVisuals {
  const isStarving = stats.hunger < PET_STAT_THRESHOLDS.criticalMin
  const isOverfed = stats.hunger > PET_STAT_THRESHOLDS.overfedHunger
  const excessHunger = Math.max(
    0,
    stats.hunger - PET_STAT_THRESHOLDS.overfedHunger
  )
  const overfedScaleX = isOverfed
    ? Math.round((1.18 + Math.min(0.47, excessHunger * 0.0188)) * 100) / 100
    : 1
  const overfedScaleY = isOverfed
    ? Math.round((1.06 + Math.min(0.19, excessHunger * 0.0076)) * 100) / 100
    : 1
  const isMelting = stats.energy < PET_STAT_THRESHOLDS.criticalMin
  const isAngry = stats.happiness < PET_STAT_THRESHOLDS.criticalMin
  const dirtyTier: 0 | 1 | 2 | 3 =
    stats.hygiene < 25 ? 3 : stats.hygiene < 50 ? 2 : stats.hygiene < 75 ? 1 : 0

  return {
    isStarving,
    isOverfed,
    overfedScaleX,
    overfedScaleY,
    isMelting,
    isAngry,
    dirtyTier,
  }
}

export interface PetExpressionContext {
  isNearPet?: boolean
  isChewing?: boolean
  isPetting?: boolean
}

export function resolvePetExpression(
  content: PetContent,
  ctx?: PetExpressionContext
) {
  if (ctx?.isChewing) return happy
  if (ctx?.isPetting) return love
  if (content.isSleeping) return sleepy

  const activity = content.activeActivity?.type
  if (activity === "eat") {
    return ctx?.isNearPet ? surprised : happy
  }
  if (activity === "play") {
    return ctx?.isNearPet ? surprised : love
  }
  if (activity === "bath") {
    return ctx?.isNearPet ? shy : happy
  }
  if (activity === "sleep") {
    return idle
  }

  const { hunger, happiness, energy, hygiene } = content.stats
  const minStat = Math.min(hunger, happiness, energy, hygiene)

  if (happiness < PET_STAT_THRESHOLDS.criticalMin) return mad
  if (
    hunger < PET_STAT_THRESHOLDS.criticalMin ||
    hygiene < PET_STAT_THRESHOLDS.criticalMin
  ) {
    return sick
  }
  if (energy < PET_STAT_THRESHOLDS.sleepyEnergy) return sleepy
  if (minStat < PET_STAT_THRESHOLDS.sadMin) return sad

  const avg = (hunger + happiness + energy + hygiene) / 4
  if (avg >= PET_STAT_THRESHOLDS.happyAvg) return happy

  return idle
}

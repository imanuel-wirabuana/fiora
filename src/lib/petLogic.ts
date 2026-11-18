import {
  happy,
  idle,
  love,
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

export function getEatCooldownRemainingMs(
  content: PetContent,
  now = Date.now()
): number {
  const cooldownMin = PET_ACTIVITIES.eat.cooldownMinutes ?? 0
  if (cooldownMin <= 0 || !content.lastAteAt) return 0
  const ateMs = Date.parse(content.lastAteAt)
  if (Number.isNaN(ateMs)) return 0
  const endsAt = ateMs + cooldownMin * 60_000
  return Math.max(0, endsAt - now)
}

export function canPetPlay(content: PetContent): boolean {
  return content.stats.energy >= PET_STAT_THRESHOLDS.minEnergyToPlay
}

export function getXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level))
  return Math.round(
    PET_LEVEL_CONFIG.baseXp *
      Math.pow(PET_LEVEL_CONFIG.exponent, safeLevel - 1)
  )
}

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100))
}

export function formatStatValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function createInitialPetContent(now = Date.now()): PetContent {
  return {
    level: PET_PROFILE_CONFIG.initialLevel,
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
  const maxLevel = PET_LEVEL_CONFIG.maxLevel
  const clampedLevel =
    maxLevel !== null
      ? Math.max(1, Math.min(maxLevel, content.level))
      : Math.max(1, content.level)
  return {
    ...content,
    level: clampedLevel,
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

export function applyXpAndLevel(
  level: number,
  xp: number,
  reward: number
): { level: number; xp: number } {
  let nextLevel = level
  let nextXp = xp + reward
  while (
    (PET_LEVEL_CONFIG.maxLevel === null ||
      nextLevel < PET_LEVEL_CONFIG.maxLevel) &&
    nextXp >= getXpForLevel(nextLevel)
  ) {
    nextXp -= getXpForLevel(nextLevel)
    nextLevel += 1
  }
  return { level: nextLevel, xp: nextXp }
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
  const leveled = applyXpAndLevel(content.level, content.xp, config.xpReward)

  return {
    content: {
      ...content,
      level: leveled.level,
      xp: leveled.xp,
      stats: nextStats,
      lastUpdatedAt: new Date(now).toISOString(),
      activeActivity: null,
    },
    completedActivity: active,
  }
}

export function calculateMinigameXp(
  gameId: PetMinigameId,
  score: number
): number {
  const baseXp = PET_ACTIVITIES.play.xpReward
  const game = PET_MINIGAMES[gameId]
  const safeScore = Math.max(0, Math.floor(score))
  const bonusXp = Math.min(
    game.maxBonusXp,
    Math.floor(safeScore / game.pointsPerBonusXp)
  )
  return baseXp + bonusXp
}

export function applyMinigameReward(
  content: PetContent,
  gameId: PetMinigameId,
  score: number,
  now = Date.now()
): { content: PetContent; earnedXp: number; statDeltas: Partial<PetStats> } {
  const playConfig = PET_ACTIVITIES.play
  const earnedXp = calculateMinigameXp(gameId, score)
  const nextStats = applyStatDeltas(content.stats, playConfig.statDeltas)
  const leveled = applyXpAndLevel(content.level, content.xp, earnedXp)

  return {
    content: {
      ...content,
      level: leveled.level,
      xp: leveled.xp,
      stats: nextStats,
      lastUpdatedAt: new Date(now).toISOString(),
      activeActivity: null,
    },
    earnedXp,
    statDeltas: playConfig.statDeltas,
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

  if (minStat < PET_STAT_THRESHOLDS.criticalMin) {
    if (hygiene === minStat || hunger === minStat) return sick
    return sad
  }
  if (energy < PET_STAT_THRESHOLDS.sleepyEnergy) return sleepy
  if (minStat < PET_STAT_THRESHOLDS.sadMin) return sad

  const avg = (hunger + happiness + energy + hygiene) / 4
  if (avg >= PET_STAT_THRESHOLDS.happyAvg) return happy

  return idle
}

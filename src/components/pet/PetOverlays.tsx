import { motion } from "motion/react"
import { getPetConditionVisuals } from "@/lib/petLogic"
import type { PetStats } from "@/types/pet"

interface PetMouthOverlayProps {
  mode: "open" | "chew" | "none"
}

/**
 * Renders a reactive mouth overlay on the Blobatar face when food is near
 * ("open" wide in anticipation) or when the pet is chewing ("chew").
 */
export function PetMouthOverlay({ mode }: PetMouthOverlayProps) {
  if (mode === "none") return null

  if (mode === "open") {
    return (
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [1, 1.12, 1], opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ duration: 0.45, repeat: Infinity, repeatType: "reverse" }}
        className="pointer-events-none absolute top-[62%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      >
        <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
          <ellipse
            cx="13"
            cy="11"
            rx="9"
            ry="8"
            fill="#3b1d2a"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <ellipse cx="13" cy="15" rx="5" ry="3" fill="#fb7185" />
        </svg>
      </motion.div>
    )
  }

  return (
    <motion.div
      animate={{ scaleY: [0.35, 1, 0.35], scaleX: [1.1, 0.9, 1.1] }}
      transition={{ duration: 0.28, repeat: Infinity, ease: "easeInOut" }}
      className="pointer-events-none absolute top-[62%] left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
    >
      <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
        <ellipse
          cx="12"
          cy="9"
          rx="8"
          ry="6"
          fill="#3b1d2a"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <ellipse cx="12" cy="12" rx="4.5" ry="2.5" fill="#fb7185" />
      </svg>
    </motion.div>
  )
}

export function PetBathFoamOverlay({ progress }: { progress: number }) {
  if (progress <= 5) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pointer-events-none absolute -top-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 select-none"
    >
      <span className="text-lg">🫧</span>
      <span className="text-2xl -translate-y-1">🫧</span>
      <span className="text-base">🫧</span>
    </motion.div>
  )
}

export function PetSleepBlanketOverlay({ size = 148 }: { size?: number }) {
  const fontSize = Math.round(size * 0.95)
  const bottomOffset = Math.round(size * 0.14)

  return (
    <motion.div
      initial={{ y: 12, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 12, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      style={{
        bottom: `-${bottomOffset}px`,
        fontSize: `${fontSize}px`,
      }}
      className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2 leading-none select-none"
    >
      🛏️
    </motion.div>
  )
}

export function PetConditionOverlays({
  stats,
  size = 148,
  isSleeping = false,
}: {
  stats?: PetStats
  size?: number
  isSleeping?: boolean
}) {
  if (!stats) return null
  const { isStarving, isMelting, isAngry, dirtyTier } =
    getPetConditionVisuals(stats)

  const iconPx = Math.max(11, Math.round(size * 0.17))
  const smallPx = Math.max(10, Math.round(size * 0.14))

  return (
    <>
      {/* Hunger near 0: not feeling well */}
      {isStarving && !isSleeping && (
        <motion.span
          animate={{ y: [0, -3, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: `${iconPx}px` }}
          className="pointer-events-none absolute -top-1 left-0 z-20 leading-none select-none"
        >
          🤢
        </motion.span>
      )}

      {/* Happiness near 0: angry vein */}
      {isAngry && !isSleeping && (
        <motion.span
          animate={{ scale: [0.9, 1.2, 0.9] }}
          transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: `${iconPx}px` }}
          className="pointer-events-none absolute -top-1 right-0 z-20 leading-none select-none"
        >
          💢
        </motion.span>
      )}

      {/* Energy near 0: melting / exhausted sweat drop */}
      {isMelting && !isSleeping && (
        <motion.span
          animate={{ y: [0, 6, 0], opacity: [0.9, 0.4, 0.9] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: `${smallPx}px` }}
          className="pointer-events-none absolute top-[22%] right-[6%] z-20 leading-none select-none"
        >
          💧
        </motion.span>
      )}

      {/* Hygiene dirty tiers (every 1/4 below 100%) */}
      {dirtyTier >= 1 && (
        <motion.span
          animate={{ x: [-3, 4, -3], y: [-4, 2, -4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: `${smallPx}px` }}
          className="pointer-events-none absolute top-[12%] left-[12%] z-20 leading-none select-none"
        >
          🪰
        </motion.span>
      )}

      {dirtyTier >= 2 && (
        <>
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: `${smallPx}px` }}
            className="pointer-events-none absolute bottom-[12%] left-[4%] z-20 leading-none select-none"
          >
            🦠
          </motion.span>
          <span
            style={{ fontSize: `${iconPx}px` }}
            className="pointer-events-none absolute -right-1 bottom-0 z-20 leading-none select-none"
          >
            💩
          </span>
        </>
      )}

      {dirtyTier >= 3 && (
        <>
          <motion.span
            animate={{ x: [3, -4, 3], y: [2, -4, 2] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: `${smallPx}px` }}
            className="pointer-events-none absolute top-[28%] -right-1 z-20 leading-none select-none"
          >
            🪰
          </motion.span>
          <motion.span
            animate={{ x: [-2, 3, -2], rotate: [-10, 10, -10] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: `${smallPx}px` }}
            className="pointer-events-none absolute bottom-0 left-[2%] z-20 leading-none select-none"
          >
            🪳
          </motion.span>
        </>
      )}
    </>
  )
}

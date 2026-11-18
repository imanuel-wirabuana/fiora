import { motion } from "motion/react"

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

export function PetSleepBlanketOverlay() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-14 w-32 -translate-x-1/2 rounded-t-2xl rounded-b-3xl border-2 border-indigo-200/80 bg-gradient-to-b from-indigo-200/90 to-indigo-300/90 shadow-sm dark:border-indigo-700/60 dark:from-indigo-900/90 dark:to-indigo-950/90"
    >
      <div className="mt-1.5 flex justify-center gap-2 text-xs opacity-75">
        <span>⭐</span>
        <span>🌙</span>
        <span>⭐</span>
      </div>
    </motion.div>
  )
}

import confetti from "canvas-confetti"

/**
 * Fire a burst of confetti using the given emoji as the particle shape,
 * with particle count scaled by the mood's score (100 * score).
 */
export function fireEmojiConfetti(emoji: string, score = 0.5) {
  if (typeof window === "undefined" || !emoji.trim()) return

  try {
    const scalar = 8
    const particleCount = Math.max(1, Math.round(100 * score))
    const emojiShape = confetti.shapeFromText({
      text: emoji.trim(),
      scalar,
    })

    void confetti({
      particleCount,
      angle: 90,
      spread: 55,
      startVelocity: 55,
      origin: { y: 0.85 },
      scalar,
      flat: true,
      shapes: [emojiShape],
      zIndex: 9999,
      disableForReducedMotion: true,
    })
  } catch {
    // Ignore canvas/confetti errors in unsupported environments
  }
}


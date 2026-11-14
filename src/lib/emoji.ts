const NOTO_EMOJI_CDN_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest"

/**
 * Convert a Unicode emoji string into Google Noto's lowercase underscore-joined
 * hex codepoint format (stripping variation selector `fe0f`).
 */
export function emojiToNotoCodepoint(emoji: string): string {
  const trimmed = emoji.trim()
  if (!trimmed) return ""

  return Array.from(trimmed)
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter((hex): hex is string => Boolean(hex && hex !== "fe0f"))
    .join("_")
}

/**
 * Build the Google Noto Animated Emoji Lottie JSON URL for a Unicode emoji.
 * Returns null if the input does not produce a valid codepoint.
 */
export function getNotoLottieUrl(emoji: string): string | null {
  const codepoint = emojiToNotoCodepoint(emoji)
  if (!codepoint) return null
  return `${NOTO_EMOJI_CDN_BASE}/${codepoint}/lottie.json`
}


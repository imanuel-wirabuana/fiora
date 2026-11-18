export type PetRoomLayer = "backdrop" | "back" | "mid" | "front"
export type PetRoomAnimation = "float" | "sway" | "twinkle" | "none"

export interface PetRoomDecoration {
  emoji: string
  /** Horizontal position in % (0-100) */
  x: number
  /** Vertical position in % (0-100) */
  y: number
  scale: number
  rotate?: number
  opacity?: number
  layer: PetRoomLayer
  animation?: PetRoomAnimation
  interactive?: boolean
}

export interface PetRoomTheme {
  id: string
  name: string
  description: string
  unlockLevel: number
  signatureEmoji: string
  /** Full-bleed background gradient classes */
  background: string
  /** Top sky / ceiling atmospheric accent classes */
  skyClass: string
  /** Bottom floor / ground horizon band classes */
  floorClass: string
  /** Subtle ambient glow behind the pet */
  ambientGlowClass: string
  palette: {
    primary: string
    secondary: string
    accent: string
  }
  decorations: PetRoomDecoration[]
}

export const PET_ROOM_THEMES: PetRoomTheme[] = [
  {
    id: "cozy-corner",
    name: "Cozy Corner",
    description: "Warm, comfortable home with soft cushions and afternoon tea.",
    unlockLevel: 1,
    signatureEmoji: "🛋️",
    background:
      "bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200/90 dark:from-stone-900 dark:via-amber-950/60 dark:to-stone-950",
    skyClass:
      "bg-gradient-to-b from-amber-200/60 via-orange-100/20 to-transparent dark:from-amber-900/30",
    floorClass:
      "bg-gradient-to-t from-amber-800/25 via-amber-600/15 to-transparent dark:from-stone-950/90",
    ambientGlowClass: "bg-amber-300/30 dark:bg-amber-500/15",
    palette: {
      primary: "#FEF3C7",
      secondary: "#FDE68A",
      accent: "#92400E",
    },
    decorations: [
      { emoji: "🪟", x: 50, y: 27, scale: 12.0, opacity: 0.55, layer: "backdrop" },
      { emoji: "🛋️", x: 50, y: 66, scale: 17.5, opacity: 0.72, layer: "backdrop" },
      { emoji: "🪔", x: 22, y: 16, scale: 2.6, layer: "back", animation: "sway", interactive: true },
      { emoji: "🪔", x: 78, y: 16, scale: 2.6, layer: "back", animation: "sway", interactive: true },
      { emoji: "🕰️", x: 80, y: 28, scale: 2.4, layer: "back" },
      { emoji: "🛏️", x: 16, y: 66, scale: 5.2, opacity: 0.85, layer: "mid", interactive: true },
      { emoji: "🪴", x: 84, y: 64, scale: 4.5, layer: "mid", animation: "sway" },
      { emoji: "🪴", x: 14, y: 34, scale: 2.6, layer: "back", animation: "sway" },
      { emoji: "🧸", x: 28, y: 74, scale: 2.5, layer: "front", rotate: -10, interactive: true },
      { emoji: "🫖", x: 68, y: 73, scale: 2.2, layer: "front", interactive: true },
      { emoji: "🧶", x: 79, y: 76, scale: 1.9, layer: "front", rotate: 14 },
      { emoji: "🧺", x: 86, y: 73, scale: 2.4, layer: "front" },
      { emoji: "🥿", x: 44, y: 77, scale: 1.6, layer: "front", rotate: -12 },
    ],
  },
  {
    id: "sunny-meadow",
    name: "Sunny Meadow",
    description: "Bright garden filled with blooming flowers and fluttering wings.",
    unlockLevel: 10,
    signatureEmoji: "🌻",
    background:
      "bg-gradient-to-b from-sky-300/80 via-amber-50 to-emerald-200 dark:from-sky-950 dark:via-emerald-950/70 dark:to-green-950",
    skyClass:
      "bg-gradient-to-b from-yellow-200/55 via-sky-200/20 to-transparent dark:from-sky-900/40",
    floorClass:
      "bg-gradient-to-t from-emerald-500/45 via-lime-300/35 to-transparent dark:from-emerald-950/90",
    ambientGlowClass: "bg-yellow-300/35 dark:bg-yellow-500/15",
    palette: {
      primary: "#FEF08A",
      secondary: "#86EFAC",
      accent: "#38BDF8",
    },
    decorations: [
      { emoji: "🌤️", x: 74, y: 20, scale: 11.5, opacity: 0.75, layer: "backdrop", animation: "float" },
      { emoji: "🌻", x: 18, y: 66, scale: 13.5, opacity: 0.72, layer: "backdrop", animation: "sway" },
      { emoji: "🌻", x: 82, y: 66, scale: 13.5, opacity: 0.72, layer: "backdrop", animation: "sway" },
      { emoji: "🌾", x: 50, y: 76, scale: 16.0, opacity: 0.55, layer: "backdrop", animation: "sway" },
      { emoji: "🦋", x: 24, y: 22, scale: 2.4, layer: "back", animation: "float", interactive: true },
      { emoji: "🦋", x: 48, y: 17, scale: 1.9, layer: "back", animation: "float", rotate: 12 },
      { emoji: "🐝", x: 68, y: 31, scale: 2.0, layer: "back", animation: "float", interactive: true },
      { emoji: "🌷", x: 26, y: 73, scale: 3.2, layer: "mid", animation: "sway" },
      { emoji: "🌼", x: 74, y: 73, scale: 3.2, layer: "mid", animation: "sway" },
      { emoji: "🍄", x: 16, y: 76, scale: 2.3, layer: "front", interactive: true },
      { emoji: "🐞", x: 42, y: 77, scale: 1.6, layer: "front", rotate: 15, interactive: true },
      { emoji: "🌱", x: 58, y: 76, scale: 2.0, layer: "front" },
      { emoji: "🪺", x: 84, y: 76, scale: 2.1, layer: "front" },
    ],
  },
  {
    id: "tropical-escape",
    name: "Tropical Escape",
    description: "Turquoise shoreline, warm sand, and playful ocean friends.",
    unlockLevel: 20,
    signatureEmoji: "🏖️",
    background:
      "bg-gradient-to-b from-sky-300 via-cyan-200 to-amber-200 dark:from-cyan-950 dark:via-teal-950 dark:to-amber-950/70",
    skyClass:
      "bg-gradient-to-b from-amber-200/50 via-cyan-100/20 to-transparent",
    floorClass:
      "bg-gradient-to-t from-amber-300/80 via-amber-200/45 to-transparent dark:from-amber-950/80",
    ambientGlowClass: "bg-cyan-300/30 dark:bg-cyan-500/15",
    palette: {
      primary: "#2DD4BF",
      secondary: "#FDE68A",
      accent: "#FB7185",
    },
    decorations: [
      { emoji: "🏝️", x: 50, y: 54, scale: 18.5, opacity: 0.65, layer: "backdrop" },
      { emoji: "🌊", x: 25, y: 76, scale: 13.0, opacity: 0.6, layer: "backdrop", animation: "sway" },
      { emoji: "🌊", x: 75, y: 76, scale: 13.0, opacity: 0.6, layer: "backdrop", animation: "sway" },
      { emoji: "🦜", x: 78, y: 20, scale: 2.6, layer: "back", animation: "sway", interactive: true },
      { emoji: "🐠", x: 22, y: 25, scale: 2.2, layer: "back", animation: "float", interactive: true },
      { emoji: "🪼", x: 74, y: 34, scale: 2.2, layer: "back", animation: "float" },
      { emoji: "🏖️", x: 19, y: 66, scale: 5.5, layer: "mid", interactive: true },
      { emoji: "🪸", x: 82, y: 68, scale: 4.5, layer: "mid" },
      { emoji: "🥥", x: 31, y: 75, scale: 2.1, layer: "front", interactive: true },
      { emoji: "🐚", x: 66, y: 76, scale: 1.9, layer: "front", rotate: -12 },
      { emoji: "🦀", x: 78, y: 76, scale: 2.2, layer: "front", interactive: true },
      { emoji: "🩴", x: 18, y: 76, scale: 1.8, layer: "front", rotate: 18 },
    ],
  },
  {
    id: "sakura-sanctuary",
    name: "Sakura Sanctuary",
    description: "Peaceful blossom garden with lanterns and traditional charm.",
    unlockLevel: 30,
    signatureEmoji: "🌸",
    background:
      "bg-gradient-to-b from-pink-200 via-rose-100 to-pink-200/90 dark:from-rose-950 dark:via-stone-900 dark:to-pink-950/80",
    skyClass:
      "bg-gradient-to-b from-pink-300/60 via-rose-200/25 to-transparent dark:from-pink-950/50",
    floorClass:
      "bg-gradient-to-t from-rose-300/75 via-pink-200/40 to-transparent dark:from-rose-950/80",
    ambientGlowClass: "bg-pink-300/35 dark:bg-pink-500/15",
    palette: {
      primary: "#FBCFE8",
      secondary: "#FFE4E6",
      accent: "#BE123C",
    },
    decorations: [
      { emoji: "⛩️", x: 50, y: 58, scale: 19.5, opacity: 0.62, layer: "backdrop" },
      { emoji: "🌸", x: 14, y: 18, scale: 11.0, opacity: 0.68, layer: "backdrop", animation: "sway" },
      { emoji: "🌸", x: 86, y: 18, scale: 11.0, opacity: 0.68, layer: "backdrop", animation: "sway" },
      { emoji: "🏮", x: 24, y: 20, scale: 2.8, layer: "back", animation: "sway", interactive: true },
      { emoji: "🏮", x: 76, y: 20, scale: 2.8, layer: "back", animation: "sway", interactive: true },
      { emoji: "🐉", x: 50, y: 18, scale: 3.0, layer: "back", animation: "float" },
      { emoji: "🎋", x: 16, y: 66, scale: 5.0, layer: "mid", animation: "sway" },
      { emoji: "🎋", x: 84, y: 66, scale: 5.0, layer: "mid", animation: "sway" },
      { emoji: "🪷", x: 32, y: 75, scale: 2.3, layer: "front", interactive: true },
      { emoji: "🍵", x: 66, y: 75, scale: 2.0, layer: "front", interactive: true },
      { emoji: "🎎", x: 20, y: 75, scale: 2.3, layer: "front" },
      { emoji: "🪭", x: 79, y: 75, scale: 2.0, layer: "front", rotate: -15 },
      { emoji: "🧧", x: 48, y: 77, scale: 1.7, layer: "front", rotate: 8 },
    ],
  },
  {
    id: "enchanted-forest",
    name: "Enchanted Forest",
    description: "Mystical moss-covered woods watched over by woodland spirits.",
    unlockLevel: 40,
    signatureEmoji: "🌲",
    background:
      "bg-gradient-to-b from-slate-900 via-emerald-950 to-stone-950 text-emerald-50",
    skyClass:
      "bg-gradient-to-b from-teal-500/20 via-emerald-500/10 to-transparent",
    floorClass:
      "bg-gradient-to-t from-emerald-950 via-green-950/70 to-transparent",
    ambientGlowClass: "bg-emerald-400/25",
    palette: {
      primary: "#059669",
      secondary: "#4D7C0F",
      accent: "#451A03",
    },
    decorations: [
      { emoji: "🌲", x: 50, y: 56, scale: 20.0, opacity: 0.45, layer: "backdrop" },
      { emoji: "🌲", x: 16, y: 60, scale: 17.0, opacity: 0.7, layer: "backdrop" },
      { emoji: "🌲", x: 84, y: 60, scale: 17.0, opacity: 0.7, layer: "backdrop" },
      { emoji: "🌙", x: 76, y: 18, scale: 4.2, layer: "back", animation: "twinkle" },
      { emoji: "🦉", x: 24, y: 22, scale: 2.4, layer: "back", animation: "sway", interactive: true },
      { emoji: "🍃", x: 48, y: 20, scale: 2.0, layer: "back", animation: "float" },
      { emoji: "🦌", x: 22, y: 69, scale: 3.4, layer: "mid", interactive: true },
      { emoji: "🐺", x: 78, y: 70, scale: 3.0, layer: "mid", interactive: true },
      { emoji: "🪵", x: 28, y: 76, scale: 2.2, layer: "front" },
      { emoji: "🐿️", x: 38, y: 75, scale: 1.9, layer: "front", interactive: true },
      { emoji: "🪨", x: 65, y: 76, scale: 2.1, layer: "front" },
      { emoji: "🪹", x: 82, y: 76, scale: 1.9, layer: "front" },
    ],
  },
  {
    id: "cosmic-observatory",
    name: "Cosmic Observatory",
    description: "Floating among distant galaxies, planets, and shooting stars.",
    unlockLevel: 50,
    signatureEmoji: "🌌",
    background:
      "bg-gradient-to-b from-slate-950 via-indigo-950 to-violet-950 text-indigo-50",
    skyClass:
      "bg-gradient-to-b from-fuchsia-500/20 via-indigo-500/10 to-transparent",
    floorClass:
      "bg-gradient-to-t from-violet-950 via-indigo-950/70 to-transparent",
    ambientGlowClass: "bg-violet-500/30",
    palette: {
      primary: "#1E1B4B",
      secondary: "#7C3AED",
      accent: "#4338CA",
    },
    decorations: [
      { emoji: "🌌", x: 50, y: 48, scale: 21.0, opacity: 0.55, layer: "backdrop" },
      { emoji: "🪐", x: 22, y: 24, scale: 9.5, opacity: 0.72, layer: "backdrop", animation: "float", interactive: true },
      { emoji: "🌍", x: 50, y: 84, scale: 18.0, opacity: 0.65, layer: "backdrop", animation: "float" },
      { emoji: "🌠", x: 76, y: 18, scale: 2.8, layer: "back", animation: "twinkle" },
      { emoji: "🌑", x: 52, y: 17, scale: 2.2, layer: "back", animation: "twinkle" },
      { emoji: "🛰️", x: 78, y: 30, scale: 2.4, layer: "back", animation: "float", rotate: -15 },
      { emoji: "🚀", x: 20, y: 64, scale: 3.5, layer: "mid", animation: "float", rotate: 12, interactive: true },
      { emoji: "🔭", x: 80, y: 66, scale: 3.5, layer: "mid", interactive: true },
      { emoji: "🛸", x: 26, y: 36, scale: 2.5, layer: "mid", animation: "float", interactive: true },
      { emoji: "☄️", x: 32, y: 75, scale: 2.1, layer: "front", animation: "twinkle" },
      { emoji: "👽", x: 68, y: 75, scale: 2.1, layer: "front", interactive: true },
    ],
  },
  {
    id: "pixel-arcade",
    name: "Pixel Arcade",
    description: "Retro neon gaming lounge packed with high-score classics.",
    unlockLevel: 60,
    signatureEmoji: "🕹️",
    background:
      "bg-gradient-to-b from-purple-950 via-fuchsia-950 to-slate-950 text-fuchsia-50",
    skyClass:
      "bg-gradient-to-b from-fuchsia-500/25 via-purple-500/10 to-transparent",
    floorClass:
      "bg-gradient-to-t from-cyan-500/25 via-fuchsia-900/35 to-transparent",
    ambientGlowClass: "bg-fuchsia-500/30",
    palette: {
      primary: "#6B21A8",
      secondary: "#E879F9",
      accent: "#38BDF8",
    },
    decorations: [
      { emoji: "👾", x: 50, y: 36, scale: 18.0, opacity: 0.35, layer: "backdrop", animation: "float" },
      { emoji: "🕹️", x: 20, y: 66, scale: 11.0, opacity: 0.65, layer: "backdrop" },
      { emoji: "🎮", x: 80, y: 66, scale: 11.0, opacity: 0.65, layer: "backdrop", rotate: -8 },
      { emoji: "👾", x: 23, y: 20, scale: 2.8, layer: "back", animation: "float", interactive: true },
      { emoji: "🏆", x: 50, y: 18, scale: 2.8, layer: "back", animation: "twinkle", interactive: true },
      { emoji: "🎧", x: 77, y: 20, scale: 2.6, layer: "back", animation: "sway" },
      { emoji: "🎯", x: 78, y: 35, scale: 2.4, layer: "mid" },
      { emoji: "🎲", x: 26, y: 74, scale: 2.1, layer: "front", rotate: 14, interactive: true },
      { emoji: "🧩", x: 42, y: 76, scale: 2.0, layer: "front", rotate: -8 },
      { emoji: "💿", x: 62, y: 75, scale: 2.0, layer: "front", animation: "twinkle" },
      { emoji: "📼", x: 78, y: 76, scale: 1.9, layer: "front" },
      { emoji: "🔋", x: 16, y: 75, scale: 1.8, layer: "front" },
    ],
  },
  {
    id: "cloud-kingdom",
    name: "Cloud Kingdom",
    description: "Dreamy sky sanctuary drifting over rainbows and soft clouds.",
    unlockLevel: 70,
    signatureEmoji: "☁️",
    background:
      "bg-gradient-to-b from-sky-300/80 via-indigo-100 to-purple-100 dark:from-sky-950 dark:via-indigo-950 dark:to-purple-950",
    skyClass:
      "bg-gradient-to-b from-white/60 via-sky-100/20 to-transparent dark:from-sky-900/30",
    floorClass:
      "bg-gradient-to-t from-white/95 via-white/60 to-transparent dark:from-indigo-950/90",
    ambientGlowClass: "bg-white/50 dark:bg-sky-400/20",
    palette: {
      primary: "#BAE6FD",
      secondary: "#FFFFFF",
      accent: "#C4B5FD",
    },
    decorations: [
      { emoji: "🌈", x: 50, y: 42, scale: 20.0, opacity: 0.6, layer: "backdrop" },
      { emoji: "☁️", x: 22, y: 72, scale: 15.0, opacity: 0.85, layer: "backdrop", animation: "float" },
      { emoji: "☁️", x: 78, y: 72, scale: 15.0, opacity: 0.85, layer: "backdrop", animation: "float" },
      { emoji: "☁️", x: 50, y: 76, scale: 16.0, opacity: 0.9, layer: "backdrop" },
      { emoji: "🌤️", x: 22, y: 19, scale: 3.0, layer: "back", animation: "float" },
      { emoji: "🌟", x: 78, y: 20, scale: 2.5, layer: "back", animation: "twinkle", interactive: true },
      { emoji: "🦄", x: 22, y: 67, scale: 3.4, layer: "mid", interactive: true },
      { emoji: "🦢", x: 78, y: 68, scale: 3.2, layer: "mid", interactive: true },
      { emoji: "🪽", x: 28, y: 31, scale: 2.2, layer: "front", animation: "float" },
      { emoji: "🫧", x: 72, y: 32, scale: 2.2, layer: "front", animation: "float" },
      { emoji: "💎", x: 48, y: 75, scale: 2.0, layer: "front", animation: "twinkle", interactive: true },
      { emoji: "🌬️", x: 64, y: 75, scale: 1.8, layer: "front" },
    ],
  },
  {
    id: "fairy-tale-castle",
    name: "Fairy Tale Castle",
    description: "Enchanted royal palace sparkling with magic and treasures.",
    unlockLevel: 80,
    signatureEmoji: "🏰",
    background:
      "bg-gradient-to-b from-pink-200 via-purple-100 to-amber-100 dark:from-purple-950 dark:via-fuchsia-950/75 dark:to-amber-950/60",
    skyClass:
      "bg-gradient-to-b from-amber-200/50 via-pink-200/20 to-transparent dark:from-purple-900/40",
    floorClass:
      "bg-gradient-to-t from-amber-200/85 via-pink-100/50 to-transparent dark:from-purple-950/90",
    ambientGlowClass: "bg-amber-300/35 dark:bg-amber-400/20",
    palette: {
      primary: "#F9A8D4",
      secondary: "#FDE047",
      accent: "#C084FC",
    },
    decorations: [
      { emoji: "🏰", x: 50, y: 54, scale: 21.0, opacity: 0.7, layer: "backdrop" },
      { emoji: "🧚", x: 22, y: 21, scale: 2.6, layer: "back", animation: "float", interactive: true },
      { emoji: "👑", x: 50, y: 16, scale: 2.8, layer: "back", animation: "twinkle" },
      { emoji: "🦢", x: 78, y: 22, scale: 2.4, layer: "back", animation: "float" },
      { emoji: "🪞", x: 18, y: 66, scale: 3.6, layer: "mid", interactive: true },
      { emoji: "🏺", x: 82, y: 67, scale: 3.4, layer: "mid" },
      { emoji: "🦚", x: 74, y: 73, scale: 2.8, layer: "mid", interactive: true },
      { emoji: "🔮", x: 30, y: 74, scale: 2.3, layer: "front", animation: "twinkle", interactive: true },
      { emoji: "🪄", x: 19, y: 76, scale: 1.9, layer: "front", rotate: -20 },
      { emoji: "🗝️", x: 46, y: 76, scale: 1.8, layer: "front", rotate: 15 },
      { emoji: "💍", x: 61, y: 75, scale: 1.9, layer: "front", animation: "twinkle" },
    ],
  },
  {
    id: "mermaid-palace",
    name: "Mermaid Palace",
    description: "Luminous underwater kingdom of glowing coral and pearls.",
    unlockLevel: 90,
    signatureEmoji: "🧜",
    background:
      "bg-gradient-to-b from-cyan-400/80 via-teal-200/85 to-emerald-200 dark:from-cyan-950 dark:via-teal-950 dark:to-slate-950",
    skyClass:
      "bg-gradient-to-b from-white/45 via-cyan-200/25 to-transparent dark:from-cyan-400/15",
    floorClass:
      "bg-gradient-to-t from-amber-200/80 via-teal-300/45 to-transparent dark:from-teal-950/90",
    ambientGlowClass: "bg-teal-300/35 dark:bg-teal-400/20",
    palette: {
      primary: "#2DD4BF",
      secondary: "#0D9488",
      accent: "#F8FAFC",
    },
    decorations: [
      { emoji: "🐳", x: 50, y: 26, scale: 12.0, opacity: 0.42, layer: "backdrop", animation: "float" },
      { emoji: "🪸", x: 18, y: 70, scale: 15.0, opacity: 0.68, layer: "backdrop" },
      { emoji: "🪸", x: 82, y: 70, scale: 15.0, opacity: 0.68, layer: "backdrop" },
      { emoji: "🐬", x: 77, y: 21, scale: 2.8, layer: "back", animation: "float", interactive: true },
      { emoji: "🫧", x: 24, y: 20, scale: 2.6, layer: "back", animation: "float" },
      { emoji: "🫧", x: 74, y: 34, scale: 2.0, layer: "back", animation: "float" },
      { emoji: "🧜", x: 20, y: 66, scale: 3.8, layer: "mid", animation: "sway", interactive: true },
      { emoji: "🐙", x: 80, y: 67, scale: 3.4, layer: "mid", animation: "sway", interactive: true },
      { emoji: "🦑", x: 24, y: 34, scale: 2.2, layer: "mid", animation: "float" },
      { emoji: "🦪", x: 32, y: 75, scale: 2.2, layer: "front", interactive: true },
      { emoji: "🐡", x: 66, y: 74, scale: 2.1, layer: "front", animation: "float", interactive: true },
      { emoji: "🦭", x: 80, y: 76, scale: 2.2, layer: "front", interactive: true },
      { emoji: "🪷", x: 48, y: 76, scale: 2.0, layer: "front" },
    ],
  },
]

export function getRoomTheme(
  roomId: string | null | undefined
): PetRoomTheme | null {
  if (!roomId) return null
  return PET_ROOM_THEMES.find((room) => room.id === roomId) ?? null
}

import { useEffect, useRef, useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy, idle, love, sad, surprised } from "blobatar/expression"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PET_MINIGAMES } from "@/lib/petConfig"
import { cn } from "@/lib/utils"

interface FruitCatcherGameProps {
  avatarSeed: string
  onFinish: (score: number) => void
  onLeave?: (score: number) => void
  onScoreChange?: (score: number) => void
}

interface FallingItem {
  id: number
  x: number // 0..100 percentage
  y: number // 0..100 percentage
  speed: number // % per second
  emoji: string
  points: number
  isHazard: boolean
}

const FRUITS = ["🍎", "🍊", "🍓", "🍌", "🍇"]
const INITIAL_LIVES = PET_MINIGAMES["fruit-catcher"].initialLives ?? 3
const PET_SIZE_PX = 74
const PET_BOTTOM_OFFSET_PX = 84
const PET_HIT_RADIUS_PX = 28
const FRUIT_HIT_RADIUS_PX = 14
const BOMB_HIT_RADIUS_PX = 11

export function FruitCatcherGame({
  avatarSeed,
  onFinish,
  onLeave,
  onScoreChange,
}: FruitCatcherGameProps) {
  const { t } = useTranslation("space")
  const arenaRef = useRef<HTMLDivElement>(null)
  const onScoreChangeRef = useRef(onScoreChange)
  const petXRef = useRef(50)
  const itemsRef = useRef<FallingItem[]>([])
  const nextIdRef = useRef(1)
  const scoreRef = useRef(0)
  const livesRef = useRef(INITIAL_LIVES)
  const finishedRef = useRef(false)

  useEffect(() => {
    onScoreChangeRef.current = onScoreChange
  }, [onScoreChange])
  const keysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  })

  const [petX, setPetX] = useState(50)
  const [items, setItems] = useState<FallingItem[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [mood, setMood] = useState<"idle" | "happy" | "love" | "sad">("idle")
  const [feedback, setFeedback] = useState<{
    id: number
    text: string
    x: number
    positive: boolean
  } | null>(null)

  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerMood = (next: "happy" | "love" | "sad") => {
    setMood(next)
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
    moodTimerRef.current = setTimeout(() => setMood("idle"), 550)
  }

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  // Main game loop with exponential pace scaling & pixel-space hitboxes
  useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()
    let elapsedSec = 0
    let spawnAccumulator = 0

    const step = (now: number) => {
      if (finishedRef.current) return
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      elapsedSec += dt

      // Exponential pace multiplier: grows steadily the longer you survive
      const pace = Math.min(2.8, Math.pow(1.12, elapsedSec / 10))

      // Keyboard movement
      const moveSpeed = 76 * Math.min(1.5, pace)
      if (keysRef.current.left) {
        petXRef.current = Math.max(8, petXRef.current - moveSpeed * dt)
      }
      if (keysRef.current.right) {
        petXRef.current = Math.min(92, petXRef.current + moveSpeed * dt)
      }

      // Spawn falling items exponentially faster over time
      spawnAccumulator += dt
      const spawnInterval = Math.max(0.26, 0.72 / pace)
      if (spawnAccumulator >= spawnInterval) {
        spawnAccumulator = 0
        const bombChance = Math.min(0.32, 0.16 + elapsedSec * 0.0025)
        const roll = Math.random()
        const isHazard = roll < bombChance
        const isStar = !isHazard && roll < bombChance + 0.12
        const emoji = isHazard
          ? "💣"
          : isStar
            ? "⭐"
            : (FRUITS[Math.floor(Math.random() * FRUITS.length)] ?? "🍎")
        itemsRef.current.push({
          id: nextIdRef.current++,
          x: 8 + Math.random() * 84,
          y: -5,
          speed: (isStar ? 38 : 26 + Math.random() * 14) * pace,
          emoji,
          points: isHazard ? 0 : isStar ? 25 : 10,
          isHazard,
        })
      }

      // Accurate pixel-space circular collision
      const rect = arenaRef.current?.getBoundingClientRect()
      const arenaW = rect?.width || 380
      const arenaH = rect?.height || 640
      const petCenterPxX = (petXRef.current / 100) * arenaW
      const petCenterPxY = arenaH - PET_BOTTOM_OFFSET_PX - PET_SIZE_PX / 2

      const surviving: FallingItem[] = []
      for (const item of itemsRef.current) {
        const nextY = item.y + item.speed * dt
        const itemPxX = (item.x / 100) * arenaW
        const itemPxY = (nextY / 100) * arenaH
        const hitDist =
          PET_HIT_RADIUS_PX +
          (item.isHazard ? BOMB_HIT_RADIUS_PX : FRUIT_HIT_RADIUS_PX)
        const caught =
          Math.hypot(itemPxX - petCenterPxX, itemPxY - petCenterPxY) <= hitDist

        if (caught) {
          if (item.isHazard) {
            livesRef.current = Math.max(0, livesRef.current - 1)
            setLives(livesRef.current)
            setFeedback({
              id: item.id,
              text: "-1 ❤️",
              x: item.x,
              positive: false,
            })
            triggerMood("sad")
            if (livesRef.current <= 0 && !finishedRef.current) {
              finishedRef.current = true
              window.setTimeout(() => onFinish(scoreRef.current), 350)
              return
            }
          } else {
            scoreRef.current += item.points
            setScore(scoreRef.current)
            onScoreChangeRef.current?.(scoreRef.current)
            setFeedback({
              id: item.id,
              text: `+${item.points}`,
              x: item.x,
              positive: true,
            })
            triggerMood(item.points >= 25 ? "love" : "happy")
          }
          continue
        }

        if (nextY < 104) {
          surviving.push({ ...item, y: nextY })
        }
      }
      itemsRef.current = surviving

      setPetX(petXRef.current)
      setItems([...surviving])
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(rafId)
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
    }
  }, [onFinish])

  const updatePetFromClientX = (clientX: number) => {
    const el = arenaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    petXRef.current = Math.max(8, Math.min(92, pct))
  }

  const expression =
    mood === "love"
      ? love
      : mood === "happy"
        ? happy
        : mood === "sad"
          ? sad
          : items.some(
                (i) => !i.isHazard && i.y > 55 && Math.abs(i.x - petX) < 16
              )
            ? surprised
            : idle

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (finishedRef.current) return
    finishedRef.current = true
    if (onLeave) {
      onLeave(scoreRef.current)
    } else {
      onFinish(scoreRef.current)
    }
  }

  return (
    <div
      ref={arenaRef}
      onPointerDown={(e) => updatePetFromClientX(e.clientX)}
      onPointerMove={(e) => {
        if (e.buttons > 0 || e.pointerType === "touch") {
          updatePetFromClientX(e.clientX)
        }
      }}
      className="relative flex-1 touch-none overflow-hidden bg-gradient-to-b from-sky-100/80 via-amber-50/50 to-emerald-100/70 select-none dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40"
    >
      {/* Floating HUD */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/80 px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-md">
        <span>
          {t("pet.minigames.score")}:{" "}
          <span className="tabular-nums text-primary">{score}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs">
            {Array.from({ length: INITIAL_LIVES }, (_, i) => (
              <span
                key={i}
                className={i < lives ? "opacity-100" : "opacity-30"}
              >
                {i < lives ? "❤️" : "🤍"}
              </span>
            ))}
          </span>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleLeaveClick}
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="size-3" />
            <span>{t("pet.minigames.leave")}</span>
          </button>
        </div>
      </div>

      {/* Falling items */}
      {items.map((item) => (
        <div
          key={item.id}
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-3xl leading-none"
        >
          {item.emoji}
        </div>
      ))}

      {/* Score feedback */}
      {feedback && (
        <div
          key={feedback.id}
          style={{
            left: `${feedback.x}%`,
            bottom: `${PET_BOTTOM_OFFSET_PX + PET_SIZE_PX + 10}px`,
          }}
          className={cn(
            "pointer-events-none absolute -translate-x-1/2 text-sm font-bold animate-out fade-out",
            feedback.positive ? "text-emerald-600" : "text-destructive"
          )}
        >
          {feedback.text}
        </div>
      )}

      {/* Pet Catcher */}
      <div
        style={{ left: `${petX}%`, bottom: `${PET_BOTTOM_OFFSET_PX}px` }}
        className="pointer-events-none absolute -translate-x-1/2"
      >
        <Blobatar
          name={avatarSeed}
          size={PET_SIZE_PX}
          expression={expression}
          animate="always"
        />
      </div>

      {/* Subtle Bottom Hint */}
      <p className="pointer-events-none absolute inset-x-4 bottom-16 z-20 text-center text-[11px] font-medium text-muted-foreground/80">
        {t("pet.minigames.hints.fruit-catcher")}
      </p>
    </div>
  )
}

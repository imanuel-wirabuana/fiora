import { useEffect, useRef, useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy, idle, love, sad, surprised } from "blobatar/expression"
import { useTranslation } from "react-i18next"
import { PET_MINIGAMES } from "@/lib/petConfig"
import { cn } from "@/lib/utils"

interface FruitCatcherGameProps {
  avatarSeed: string
  onFinish: (score: number) => void
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

export function FruitCatcherGame({
  avatarSeed,
  onFinish,
}: FruitCatcherGameProps) {
  const { t } = useTranslation("space")
  const arenaRef = useRef<HTMLDivElement>(null)
  const petXRef = useRef(50)
  const itemsRef = useRef<FallingItem[]>([])
  const nextIdRef = useRef(1)
  const scoreRef = useRef(0)
  const livesRef = useRef(INITIAL_LIVES)
  const finishedRef = useRef(false)
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

  // Main game loop
  useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()
    let spawnAccumulator = 0

    const step = (now: number) => {
      if (finishedRef.current) return
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      // Keyboard movement
      if (keysRef.current.left) {
        petXRef.current = Math.max(10, petXRef.current - 72 * dt)
      }
      if (keysRef.current.right) {
        petXRef.current = Math.min(90, petXRef.current + 72 * dt)
      }

      // Spawn falling items (gently faster as score rises)
      spawnAccumulator += dt
      const spawnInterval = Math.max(0.38, 0.65 - scoreRef.current * 0.0008)
      if (spawnAccumulator >= spawnInterval) {
        spawnAccumulator = 0
        const roll = Math.random()
        const isHazard = roll < 0.18
        const isStar = !isHazard && roll < 0.3
        const emoji = isHazard
          ? "💣"
          : isStar
            ? "⭐"
            : (FRUITS[Math.floor(Math.random() * FRUITS.length)] ?? "🍎")
        const speedBoost = Math.min(24, scoreRef.current * 0.06)
        itemsRef.current.push({
          id: nextIdRef.current++,
          x: 8 + Math.random() * 84,
          y: -6,
          speed: (isStar ? 42 : 28 + Math.random() * 18) + speedBoost,
          emoji,
          points: isHazard ? 0 : isStar ? 25 : 10,
          isHazard,
        })
      }

      // Advance & collide
      const surviving: FallingItem[] = []
      for (const item of itemsRef.current) {
        const nextY = item.y + item.speed * dt
        const caught =
          nextY >= 74 && nextY <= 90 && Math.abs(item.x - petXRef.current) < 13

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
    petXRef.current = Math.max(10, Math.min(90, pct))
  }

  const expression =
    mood === "love"
      ? love
      : mood === "happy"
        ? happy
        : mood === "sad"
          ? sad
          : items.some((i) => !i.isHazard && i.y > 55 && Math.abs(i.x - petX) < 18)
            ? surprised
            : idle

  return (
    <div className="flex flex-col gap-3">
      {/* HUD */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-semibold">
        <span>
          {t("pet.minigames.score")}:{" "}
          <span className="tabular-nums text-primary">{score}</span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-0.5 text-xs">
          {Array.from({ length: INITIAL_LIVES }, (_, i) => (
            <span key={i} className={i < lives ? "opacity-100" : "opacity-30"}>
              {i < lives ? "❤️" : "🤍"}
            </span>
          ))}
        </span>
      </div>

      {/* Arena */}
      <div
        ref={arenaRef}
        onPointerDown={(e) => updatePetFromClientX(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === "touch") {
            updatePetFromClientX(e.clientX)
          }
        }}
        className="relative h-[420px] w-full touch-none overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-sky-100/80 via-amber-50/50 to-emerald-100/70 select-none dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40"
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-3xl"
          >
            {item.emoji}
          </div>
        ))}

        {feedback && (
          <div
            key={feedback.id}
            style={{ left: `${feedback.x}%`, top: "70%" }}
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
          style={{ left: `${petX}%`, bottom: "14px" }}
          className="pointer-events-none absolute -translate-x-1/2"
        >
          <Blobatar
            name={avatarSeed}
            size={74}
            expression={expression}
            animate="always"
          />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("pet.minigames.hints.fruit-catcher")}
      </p>
    </div>
  )
}

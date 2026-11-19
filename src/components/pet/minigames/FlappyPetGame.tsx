import { useCallback, useEffect, useRef, useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy, idle, sad, surprised } from "blobatar/expression"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

interface FlappyPetGameProps {
  avatarSeed: string
  onFinish: (score: number) => void
  onLeave?: (score: number) => void
  onScoreChange?: (score: number) => void
}

interface PipePair {
  id: number
  x: number // 0..100 %
  gapY: number // center of gap (25..72 %)
  gapHeight: number // % of arena height
  passed: boolean
}

const PET_X_PCT = 24
const PET_SIZE_PX = 54
const PET_HIT_RADIUS_PX = 20
const PIPE_WIDTH_PCT = 13
const BASE_GAP_HEIGHT = 28
const MIN_GAP_HEIGHT = 19
const GRAVITY = 128 // % / s^2
const FLAP_VELOCITY = -45 // % / s
const BASE_PIPE_SPEED = 29 // % / s

function circleIntersectsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw))
  const closestY = Math.max(ry, Math.min(cy, ry + rh))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < r * r
}

export function FlappyPetGame({
  avatarSeed,
  onFinish,
  onLeave,
  onScoreChange,
}: FlappyPetGameProps) {
  const { t } = useTranslation("space")
  const arenaRef = useRef<HTMLDivElement>(null)
  const onScoreChangeRef = useRef(onScoreChange)
  const startedRef = useRef(false)
  const gameOverRef = useRef(false)
  const petYRef = useRef(46)
  const velYRef = useRef(0)
  const pipesRef = useRef<PipePair[]>([])
  const nextIdRef = useRef(1)
  const scoreRef = useRef(0)

  useEffect(() => {
    onScoreChangeRef.current = onScoreChange
  }, [onScoreChange])

  const [started, setStarted] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [petY, setPetY] = useState(46)
  const [velY, setVelY] = useState(0)
  const [pipes, setPipes] = useState<PipePair[]>([])
  const [score, setScore] = useState(0)
  const [justScored, setJustScored] = useState(false)

  const flap = useCallback(() => {
    if (gameOverRef.current) return
    if (!startedRef.current) {
      startedRef.current = true
      setStarted(true)
    }
    velYRef.current = FLAP_VELOCITY
  }, [])

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault()
        flap()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [flap])

  // Main game loop with exponential pace & pixel-space circle-vs-AABB collision
  useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()
    let elapsedSec = 0
    let spawnAccumulator = 0

    const endGame = () => {
      if (gameOverRef.current) return
      gameOverRef.current = true
      setCrashed(true)
      window.setTimeout(() => {
        onFinish(scoreRef.current)
      }, 450)
    }

    const step = (now: number) => {
      if (gameOverRef.current) return
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      if (startedRef.current) {
        elapsedSec += dt
        const pace = Math.min(2.4, Math.pow(1.1, elapsedSec / 10))
        const pipeSpeed = BASE_PIPE_SPEED * pace
        const spawnInterval = Math.max(0.8, 1.65 / pace)
        const currentGap = Math.max(
          MIN_GAP_HEIGHT,
          BASE_GAP_HEIGHT - elapsedSec * 0.14
        )

        velYRef.current += GRAVITY * dt
        petYRef.current += velYRef.current * dt

        const rect = arenaRef.current?.getBoundingClientRect()
        const arenaW = rect?.width || 380
        const arenaH = rect?.height || 640
        const petPxX = (PET_X_PCT / 100) * arenaW
        const petPxY = (petYRef.current / 100) * arenaH

        // Bounds check (ceiling / ground above BottomNav)
        const groundY = arenaH - 64
        if (
          petPxY - PET_HIT_RADIUS_PX <= 4 ||
          petPxY + PET_HIT_RADIUS_PX >= groundY
        ) {
          petYRef.current =
            Math.max(
              PET_HIT_RADIUS_PX + 4,
              Math.min(groundY - PET_HIT_RADIUS_PX, petPxY)
            ) /
            (arenaH / 100)
          setPetY(petYRef.current)
          endGame()
          return
        }

        // Spawn pipes
        spawnAccumulator += dt
        if (spawnAccumulator >= spawnInterval) {
          spawnAccumulator = 0
          pipesRef.current.push({
            id: nextIdRef.current++,
            x: 108,
            gapY: 26 + Math.random() * 42,
            gapHeight: currentGap,
            passed: false,
          })
        }

        // Move & exact pixel-space circle-vs-rect collision
        const pipeWidthPx = (PIPE_WIDTH_PCT / 100) * arenaW
        const nextPipes: PipePair[] = []
        for (const pipe of pipesRef.current) {
          const nx = pipe.x - pipeSpeed * dt
          let passed = pipe.passed

          if (!passed && nx + PIPE_WIDTH_PCT / 2 < PET_X_PCT) {
            passed = true
            scoreRef.current += 1
            setScore(scoreRef.current)
            onScoreChangeRef.current?.(scoreRef.current)
            setJustScored(true)
            window.setTimeout(() => setJustScored(false), 350)
          }

          const pipeLeftPx = (nx / 100) * arenaW - pipeWidthPx / 2
          const topPipeHeightPx =
            (Math.max(0, pipe.gapY - pipe.gapHeight / 2) / 100) * arenaH
          const bottomPipeTopPx =
            ((pipe.gapY + pipe.gapHeight / 2) / 100) * arenaH
          const bottomPipeHeightPx = Math.max(0, arenaH - bottomPipeTopPx)

          const hitTop = circleIntersectsRect(
            petPxX,
            petPxY,
            PET_HIT_RADIUS_PX,
            pipeLeftPx,
            0,
            pipeWidthPx,
            topPipeHeightPx
          )
          const hitBottom = circleIntersectsRect(
            petPxX,
            petPxY,
            PET_HIT_RADIUS_PX,
            pipeLeftPx,
            bottomPipeTopPx,
            pipeWidthPx,
            bottomPipeHeightPx
          )

          if (hitTop || hitBottom) {
            setPipes([...pipesRef.current])
            setPetY(petYRef.current)
            endGame()
            return
          }

          if (nx > -15) {
            nextPipes.push({ ...pipe, x: nx, passed })
          }
        }
        pipesRef.current = nextPipes

        setPetY(petYRef.current)
        setVelY(velYRef.current)
        setPipes([...nextPipes])
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [onFinish])

  const expression = crashed
    ? sad
    : justScored
      ? happy
      : velY < -10
        ? surprised
        : idle

  const tiltDeg = started ? Math.max(-28, Math.min(35, velY * 0.6)) : 0

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (gameOverRef.current) return
    gameOverRef.current = true
    if (onLeave) {
      onLeave(scoreRef.current)
    } else {
      onFinish(scoreRef.current)
    }
  }

  return (
    <div
      ref={arenaRef}
      onPointerDown={flap}
      className="relative flex-1 cursor-pointer touch-none overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200/80 select-none dark:from-slate-900 dark:via-sky-950/60 dark:to-emerald-950/50"
    >
      {/* Floating HUD */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/80 px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-md">
        <span>
          {t("pet.minigames.score")}:{" "}
          <span className="tabular-nums text-primary">{score}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pink-500/15 px-2.5 py-0.5 text-xs font-bold text-pink-700 dark:text-pink-300">
            {t("pet.minigames.endless")}
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

      {/* Pipes */}
      {pipes.map((pipe) => {
        const topHeight = Math.max(0, pipe.gapY - pipe.gapHeight / 2)
        const bottomTop = pipe.gapY + pipe.gapHeight / 2
        return (
          <div key={pipe.id}>
            <div
              style={{
                left: `${pipe.x}%`,
                top: 0,
                width: `${PIPE_WIDTH_PCT}%`,
                height: `${topHeight}%`,
              }}
              className="pointer-events-none absolute -translate-x-1/2 rounded-b-xl border-2 border-emerald-600/40 bg-emerald-500/85 shadow-sm"
            />
            <div
              style={{
                left: `${pipe.x}%`,
                top: `${bottomTop}%`,
                width: `${PIPE_WIDTH_PCT}%`,
                bottom: 0,
              }}
              className="pointer-events-none absolute -translate-x-1/2 rounded-t-xl border-2 border-emerald-600/40 bg-emerald-500/85 shadow-sm"
            />
          </div>
        )
      })}

      {/* Pet as the Bird */}
      <div
        style={{
          left: `${PET_X_PCT}%`,
          top: `${petY}%`,
          transform: `translate(-50%, -50%) rotate(${tiltDeg}deg)`,
        }}
        className="pointer-events-none absolute transition-transform duration-75"
      >
        <Blobatar
          name={avatarSeed}
          size={PET_SIZE_PX}
          expression={expression}
          animate="always"
        />
      </div>

      {/* Tap to start prompt */}
      {!started && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-1.5">
          <span className="rounded-full bg-background/85 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
            {t("pet.minigames.tapToFlap")}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground/85">
            {t("pet.minigames.hints.flappy-pet")}
          </span>
        </div>
      )}
    </div>
  )
}

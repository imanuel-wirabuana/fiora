import { useCallback, useEffect, useRef, useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy, idle, sad, surprised } from "blobatar/expression"
import { useTranslation } from "react-i18next"

interface FlappyPetGameProps {
  avatarSeed: string
  onFinish: (score: number) => void
}

interface PipePair {
  id: number
  x: number // 0..100 %
  gapY: number // center of gap (25..72 %)
  passed: boolean
}

const PET_X = 24
const GAP_HEIGHT = 28
const PIPE_WIDTH = 12
const GRAVITY = 135 // % / s^2
const FLAP_VELOCITY = -48 // % / s
const PIPE_SPEED = 32 // % / s

export function FlappyPetGame({ avatarSeed, onFinish }: FlappyPetGameProps) {
  const { t } = useTranslation("space")
  const startedRef = useRef(false)
  const gameOverRef = useRef(false)
  const petYRef = useRef(48)
  const velYRef = useRef(0)
  const pipesRef = useRef<PipePair[]>([])
  const nextIdRef = useRef(1)
  const scoreRef = useRef(0)

  const [started, setStarted] = useState(false)
  const [crashed, setCrashed] = useState(false)
  const [petY, setPetY] = useState(48)
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

  // Main game loop
  useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()
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
        velYRef.current += GRAVITY * dt
        petYRef.current += velYRef.current * dt

        // Bounds check (ceiling / ground)
        if (petYRef.current <= 5 || petYRef.current >= 94) {
          petYRef.current = Math.max(5, Math.min(94, petYRef.current))
          setPetY(petYRef.current)
          endGame()
          return
        }

        // Spawn pipes
        spawnAccumulator += dt
        if (spawnAccumulator >= 1.55) {
          spawnAccumulator = 0
          pipesRef.current.push({
            id: nextIdRef.current++,
            x: 108,
            gapY: 26 + Math.random() * 44,
            passed: false,
          })
        }

        // Move & collide pipes
        const nextPipes: PipePair[] = []
        for (const pipe of pipesRef.current) {
          const nx = pipe.x - PIPE_SPEED * dt
          let passed = pipe.passed

          if (!passed && nx + PIPE_WIDTH / 2 < PET_X) {
            passed = true
            scoreRef.current += 1
            setScore(scoreRef.current)
            setJustScored(true)
            window.setTimeout(() => setJustScored(false), 350)
          }

          // Hitbox check (generous circle inside pet)
          const inPipeX =
            PET_X + 4.5 > nx - PIPE_WIDTH / 2 &&
            PET_X - 4.5 < nx + PIPE_WIDTH / 2
          if (inPipeX) {
            const topEdge = pipe.gapY - GAP_HEIGHT / 2
            const bottomEdge = pipe.gapY + GAP_HEIGHT / 2
            if (
              petYRef.current - 4.5 < topEdge ||
              petYRef.current + 4.5 > bottomEdge
            ) {
              setPipes([...pipesRef.current])
              setPetY(petYRef.current)
              endGame()
              return
            }
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

  return (
    <div className="flex flex-col gap-3">
      {/* HUD */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-semibold">
        <span>
          {t("pet.minigames.score")}:{" "}
          <span className="text-primary tabular-nums">{score}</span>
        </span>
        <span className="rounded-full bg-pink-500/15 px-3 py-0.5 text-xs font-bold text-pink-700 dark:text-pink-300">
          {t("pet.minigames.endless")}
        </span>
      </div>

      {/* Arena */}
      <div
        onPointerDown={flap}
        className="relative h-[420px] w-full cursor-pointer touch-none overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200/80 select-none dark:from-slate-900 dark:via-sky-950/60 dark:to-emerald-950/50"
      >
        {/* Pipes */}
        {pipes.map((pipe) => {
          const topHeight = Math.max(0, pipe.gapY - GAP_HEIGHT / 2)
          const bottomTop = pipe.gapY + GAP_HEIGHT / 2
          return (
            <div key={pipe.id}>
              <div
                style={{
                  left: `${pipe.x}%`,
                  top: 0,
                  width: `${PIPE_WIDTH}%`,
                  height: `${topHeight}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 rounded-b-xl border-2 border-emerald-600/40 bg-emerald-500/85 shadow-sm"
              />
              <div
                style={{
                  left: `${pipe.x}%`,
                  top: `${bottomTop}%`,
                  width: `${PIPE_WIDTH}%`,
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
            left: `${PET_X}%`,
            top: `${petY}%`,
            transform: `translate(-50%, -50%) rotate(${tiltDeg}deg)`,
          }}
          className="pointer-events-none absolute transition-transform duration-75"
        >
          <Blobatar
            name={avatarSeed}
            size={54}
            expression={expression}
            animate="always"
          />
        </div>

        {/* Tap to start prompt */}
        {!started && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
            <span className="rounded-full bg-background/85 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {t("pet.minigames.tapToFlap")}
            </span>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("pet.minigames.hints.flappy-pet")}
      </p>
    </div>
  )
}

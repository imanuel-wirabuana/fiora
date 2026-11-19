import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy, idle, love, sad, surprised } from "blobatar/expression"
import { LogOut, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface ZumaGameProps {
  avatarSeed: string
  onFinish: (score: number) => void
  onLeave?: (score: number) => void
  onScoreChange?: (score: number) => void
}

interface Point {
  x: number
  y: number
}

interface ZumaTrack {
  points: Point[]
  totalLength: number
  svgPath: string
  shooter: Point
}

interface ChainOrb {
  id: number
  color: number
  d: number // distance along track (0 .. totalLength)
}

interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  color: number
}

const ORB_COLORS = [
  "bg-rose-400 border-rose-200",
  "bg-amber-400 border-amber-200",
  "bg-emerald-400 border-emerald-200",
  "bg-sky-400 border-sky-200",
  "bg-violet-400 border-violet-200",
] as const

const ORB_SPACING = 6.2
const CHAIN_SPEED = 4.6
const PULLBACK_SPEED = 42
const INITIAL_CHAIN_COUNT = 16

function randomColor(): number {
  return Math.floor(Math.random() * ORB_COLORS.length)
}

function pickColorFromChain(orbs: ChainOrb[]): number {
  if (orbs.length === 0) return randomColor()
  const present = Array.from(new Set(orbs.map((o) => o.color)))
  return present[Math.floor(Math.random() * present.length)] ?? randomColor()
}

function nextSnakeColor(tailColor: number): number {
  // 35% chance to repeat tail color for natural Zuma pairs
  return Math.random() < 0.35 ? tailColor : randomColor()
}

/** Resamples raw polyline into equidistant points for constant orb speed */
function resampleTrack(raw: Point[], shooter: Point): ZumaTrack {
  const cumLen: number[] = [0]
  for (let i = 1; i < raw.length; i++) {
    const dx = raw[i].x - raw[i - 1].x
    const dy = raw[i].y - raw[i - 1].y
    cumLen.push(cumLen[i - 1] + Math.hypot(dx, dy))
  }
  const totalLength = cumLen[cumLen.length - 1] || 1
  const sampleCount = 240
  const points: Point[] = []

  let seg = 0
  for (let k = 0; k <= sampleCount; k++) {
    const target = (k / sampleCount) * totalLength
    while (seg < cumLen.length - 2 && cumLen[seg + 1] < target) {
      seg += 1
    }
    const segLen = cumLen[seg + 1] - cumLen[seg] || 1
    const t = Math.max(0, Math.min(1, (target - cumLen[seg]) / segLen))
    points.push({
      x: raw[seg].x + (raw[seg + 1].x - raw[seg].x) * t,
      y: raw[seg].y + (raw[seg + 1].y - raw[seg].y) * t,
    })
  }

  const svgPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")

  return { points, totalLength, svgPath, shooter }
}

function generateZumaTrack(): ZumaTrack {
  const archetype = Math.floor(Math.random() * 4)
  const dir = Math.random() < 0.5 ? 1 : -1
  const flipX = Math.random() < 0.5 ? 1 : -1
  const flipY = Math.random() < 0.5 ? 1 : -1
  const raw: Point[] = []
  const steps = 180

  if (archetype === 0) {
    // Spiral inward around center pet
    const startAngle = Math.random() * Math.PI * 2
    const turns = 1.65
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const angle = startAngle + dir * t * turns * Math.PI * 2
      const r = 42 - t * 21
      raw.push({
        x: 50 + Math.cos(angle) * r,
        y: 50 + Math.sin(angle) * r,
      })
    }
    return resampleTrack(raw, { x: 50, y: 50 })
  }

  if (archetype === 1) {
    // Rounded diamond/orbit around center pet
    const rot = Math.random() * Math.PI * 2
    const turns = 1.45
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = rot + dir * t * turns * Math.PI * 2
      const baseR = 40 - t * 18
      const r = baseR + Math.cos(4 * a) * 3.5
      raw.push({
        x: 50 + Math.cos(a) * r,
        y: 50 + Math.sin(a) * r,
      })
    }
    return resampleTrack(raw, { x: 50, y: 50 })
  }

  if (archetype === 2) {
    // Serpentine top-to-bottom wave with pet at bottom-center
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const y = 10 + t * 52
      const x = 50 + flipX * Math.sin(t * Math.PI * 3.2) * 38
      raw.push({ x, y })
    }
    return resampleTrack(raw, { x: 50, y: 80 })
  }

  // Archetype 3: Sweeping U-loop around center pet
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = -Math.PI * 0.85 + dir * t * Math.PI * 2.55
    const rx = 40 - t * 14
    const ry = 38 - t * 14
    raw.push({
      x: 50 + flipX * Math.cos(angle) * rx,
      y: 50 + flipY * Math.sin(angle) * ry,
    })
  }
  return resampleTrack(raw, { x: 50, y: 50 })
}

function getPointAtDistance(track: ZumaTrack, d: number): Point {
  const clamped = Math.max(0, Math.min(track.totalLength, d))
  const ratio = clamped / track.totalLength
  const idx = Math.min(
    track.points.length - 1,
    Math.round(ratio * (track.points.length - 1))
  )
  return track.points[idx]
}

function buildInitialChain(): ChainOrb[] {
  const orbs: ChainOrb[] = []
  let id = 1
  for (let i = INITIAL_CHAIN_COUNT - 1; i >= 0; i--) {
    orbs.push({
      id: id++,
      color: randomColor(),
      d: (INITIAL_CHAIN_COUNT - 1 - i) * ORB_SPACING,
    })
  }
  // Keep lead orb at index 0 (largest d)
  return orbs.sort((a, b) => b.d - a.d)
}

export function ZumaGame({
  avatarSeed,
  onFinish,
  onLeave,
  onScoreChange,
}: ZumaGameProps) {
  const { t } = useTranslation("space")
  const track = useMemo(() => generateZumaTrack(), [])
  const arenaRef = useRef<HTMLDivElement>(null)
  const onScoreChangeRef = useRef(onScoreChange)
  const chainRef = useRef<ChainOrb[]>(buildInitialChain())
  const nextIdRef = useRef(INITIAL_CHAIN_COUNT + 5)
  const projRef = useRef<Projectile | null>(null)
  const currentColorRef = useRef(randomColor())
  const nextColorRef = useRef(randomColor())
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    onScoreChangeRef.current = onScoreChange
  }, [onScoreChange])

  const [chain, setChain] = useState<ChainOrb[]>(buildInitialChain)
  const [proj, setProj] = useState<Projectile | null>(null)
  const [currentColor, setCurrentColor] = useState(randomColor)
  const [nextColor, setNextColor] = useState(randomColor)

  useEffect(() => {
    chainRef.current = chain
  }, [chain])

  useEffect(() => {
    currentColorRef.current = currentColor
  }, [currentColor])

  useEffect(() => {
    nextColorRef.current = nextColor
  }, [nextColor])
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2)
  const [score, setScore] = useState(0)
  const [comboBanner, setComboBanner] = useState<string | null>(null)
  const [mood, setMood] = useState<"idle" | "happy" | "love" | "sad" | "surprised">(
    "idle"
  )

  const moodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerMood = useCallback(
    (next: "happy" | "love" | "sad" | "surprised") => {
      setMood(next)
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
      moodTimerRef.current = setTimeout(() => setMood("idle"), 500)
    },
    []
  )

  const popMatchesAt = useCallback(
    (
      orbs: ChainOrb[],
      index: number,
      comboLevel = 1
    ): { orbs: ChainOrb[]; popped: boolean } => {
      if (index < 0 || index >= orbs.length) return { orbs, popped: false }
      const targetColor = orbs[index].color
      let left = index
      let right = index

      // Only check contiguous touching orbs
      while (
        left > 0 &&
        orbs[left - 1].color === targetColor &&
        orbs[left - 1].d - orbs[left].d <= ORB_SPACING * 1.15
      ) {
        left -= 1
      }
      while (
        right < orbs.length - 1 &&
        orbs[right + 1].color === targetColor &&
        orbs[right].d - orbs[right + 1].d <= ORB_SPACING * 1.15
      ) {
        right += 1
      }

      const count = right - left + 1
      if (count < 3) return { orbs, popped: false }

      const comboBonus = comboLevel > 1 ? (comboLevel - 1) * 25 : 0
      const gained = count * 15 + comboBonus
      scoreRef.current += gained
      setScore(scoreRef.current)
      onScoreChangeRef.current?.(scoreRef.current)

      if (comboLevel > 1) {
        setComboBanner(`Combo x${comboLevel}! +${comboBonus}`)
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
        comboTimerRef.current = setTimeout(() => setComboBanner(null), 900)
      }

      triggerMood(comboLevel > 1 || count >= 4 ? "love" : "happy")

      return {
        orbs: [...orbs.slice(0, left), ...orbs.slice(right + 1)],
        popped: true,
      }
    },
    [triggerMood]
  )

  // Main game loop with exponential pace scaling
  useEffect(() => {
    let rafId = 0
    let lastTime = performance.now()
    let elapsedSec = 0

    const step = (now: number) => {
      if (finishedRef.current) return
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now
      elapsedSec += dt

      let orbs = chainRef.current.map((o) => ({ ...o }))
      const pace = Math.min(2.8, Math.pow(1.1, elapsedSec / 10))
      const currentSpeed = CHAIN_SPEED * pace

      // 1. Ensure at least 1 orb exists, advance tail-connected segment, & spawn infinitely
      if (orbs.length === 0) {
        orbs.push({
          id: nextIdRef.current++,
          color: randomColor(),
          d: 0,
        })
      } else {
        const lastIdx = orbs.length - 1
        let tailStart = lastIdx
        while (
          tailStart > 0 &&
          orbs[tailStart - 1].d - orbs[tailStart].d <= ORB_SPACING * 1.05
        ) {
          tailStart -= 1
        }

        // Only tail-connected orbs move forward
        orbs[lastIdx].d += currentSpeed * dt
        for (let i = lastIdx - 1; i >= tailStart; i--) {
          const minD = orbs[i + 1].d + ORB_SPACING
          if (orbs[i].d < minD) {
            orbs[i].d = minD
          }
        }

        // Infinite snake spawning from entry portal (d = 0)
        while (orbs[orbs.length - 1].d >= ORB_SPACING) {
          const tail = orbs[orbs.length - 1]
          orbs.push({
            id: nextIdRef.current++,
            color: nextSnakeColor(tail.color),
            d: tail.d - ORB_SPACING,
          })
        }
      }

      // 2. Always reconnect any detached front segment by moving backward quickly
      let pulledAny = false
      for (let g = orbs.length - 2; g >= 0; g--) {
        const gap = orbs[g].d - orbs[g + 1].d
        if (gap > ORB_SPACING * 1.05) {
          pulledAny = true
          const pull = PULLBACK_SPEED * dt
          for (let j = 0; j <= g; j++) {
            orbs[j].d -= pull
          }
          if (orbs[g].d - orbs[g + 1].d <= ORB_SPACING) {
            const snapShift = orbs[g].d - (orbs[g + 1].d + ORB_SPACING)
            for (let j = 0; j <= g; j++) {
              orbs[j].d -= snapShift
            }
            if (orbs[g].color === orbs[g + 1].color) {
              comboRef.current += 1
              const res = popMatchesAt(orbs, g, comboRef.current)
              orbs = res.orbs
              if (!res.popped) {
                comboRef.current = 0
              }
            } else {
              comboRef.current = 0
            }
          }
          break
        }
      }
      if (!pulledAny) {
        comboRef.current = 0
      }

      // 3. Advance projectile & check collision with chain
      const p = projRef.current
      if (p) {
        const nx = p.x + p.vx * dt
        const ny = p.y + p.vy * dt

        if (nx < -5 || nx > 105 || ny < -5 || ny > 105) {
          projRef.current = null
          setProj(null)
        } else {
          let hitIdx = -1
          for (let i = 0; i < orbs.length; i++) {
            const pos = getPointAtDistance(track, orbs[i].d)
            if (Math.hypot(pos.x - nx, pos.y - ny) < 5.8) {
              hitIdx = i
              break
            }
          }

          if (hitIdx !== -1) {
            const hitOrb = orbs[hitIdx]
            const insertBefore =
              hitIdx > 0
                ? getPointAtDistance(track, hitOrb.d + ORB_SPACING * 0.5)
                : null
            const hitPos = getPointAtDistance(track, hitOrb.d)
            const distToFront = insertBefore
              ? Math.hypot(insertBefore.x - nx, insertBefore.y - ny)
              : Infinity
            const distToCurr = Math.hypot(hitPos.x - nx, hitPos.y - ny)
            const insertIdx = distToFront < distToCurr ? hitIdx : hitIdx + 1

            const newD =
              insertIdx === 0
                ? hitOrb.d + ORB_SPACING
                : orbs[insertIdx - 1].d - ORB_SPACING
            const newOrb: ChainOrb = {
              id: nextIdRef.current++,
              color: p.color,
              d: Math.max(0, newD),
            }
            orbs.splice(insertIdx, 0, newOrb)
            // Push front orbs forward so none overlap
            for (let i = insertIdx - 1; i >= 0; i--) {
              const minD = orbs[i + 1].d + ORB_SPACING
              if (orbs[i].d < minD) orbs[i].d = minD
            }
            comboRef.current = 1
            const res = popMatchesAt(orbs, insertIdx, 1)
            orbs = res.orbs
            if (!res.popped) {
              comboRef.current = 0
            }

            projRef.current = null
            setProj(null)
          } else {
            const nextProj = { ...p, x: nx, y: ny }
            projRef.current = nextProj
            setProj(nextProj)
          }
        }
      }

      // 4. Check lose condition (lead orb reached end hole)
      if (orbs.length > 0 && orbs[0].d >= track.totalLength) {
        finishedRef.current = true
        triggerMood("sad")
        chainRef.current = orbs
        setChain(orbs)
        window.setTimeout(() => onFinish(scoreRef.current), 400)
        return
      }

      chainRef.current = orbs
      setChain(orbs)
      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(rafId)
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    }
  }, [track, popMatchesAt, onFinish, triggerMood])

  const computeAngle = (clientX: number, clientY: number) => {
    const el = arenaRef.current
    if (!el) return -Math.PI / 2
    const rect = el.getBoundingClientRect()
    const sx = rect.left + (track.shooter.x / 100) * rect.width
    const sy = rect.top + (track.shooter.y / 100) * rect.height
    return Math.atan2(clientY - sy, clientX - sx)
  }

  const handleShoot = (clientX: number, clientY: number) => {
    if (projRef.current || finishedRef.current) return
    const angle = computeAngle(clientX, clientY)
    setAimAngle(angle)
    const speed = 155
    const nextProj: Projectile = {
      x: track.shooter.x,
      y: track.shooter.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: currentColorRef.current,
    }
    projRef.current = nextProj
    setProj(nextProj)
    currentColorRef.current = nextColorRef.current
    nextColorRef.current = pickColorFromChain(chainRef.current)
    setCurrentColor(currentColorRef.current)
    setNextColor(nextColorRef.current)
    triggerMood("surprised")
  }

  const handleSwapColors = (e: React.MouseEvent) => {
    e.stopPropagation()
    const prevCurr = currentColorRef.current
    currentColorRef.current = nextColorRef.current
    nextColorRef.current = prevCurr
    setCurrentColor(currentColorRef.current)
    setNextColor(nextColorRef.current)
  }

  const expression =
    mood === "love"
      ? love
      : mood === "happy"
        ? happy
        : mood === "sad"
          ? sad
          : mood === "surprised"
            ? surprised
            : idle

  const endPoint = track.points[track.points.length - 1]
  const startPoint = track.points[0]

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
      onPointerMove={(e) => setAimAngle(computeAngle(e.clientX, e.clientY))}
      onPointerDown={(e) => handleShoot(e.clientX, e.clientY)}
      className="relative flex-1 cursor-crosshair touch-none overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 select-none"
    >
      {/* Floating HUD */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/85 px-3.5 py-2 text-sm font-semibold shadow-sm backdrop-blur-md">
        <span>
          {t("pet.minigames.score")}:{" "}
          <span className="tabular-nums text-primary">{score}</span>
        </span>
        <div className="flex items-center gap-2">
          {comboBanner && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-300">
              {comboBanner}
            </span>
          )}
          <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300">
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
        {/* Randomized Track SVG */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <path
            d={track.svgPath}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={track.svgPath}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        </svg>

        {/* Entry Portal & End Hole */}
        <div
          style={{ left: `${startPoint.x}%`, top: `${startPoint.y}%` }}
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/30 ring-2 ring-emerald-300/50"
        />
        <div
          style={{ left: `${endPoint.x}%`, top: `${endPoint.y}%` }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
        >
          🕳️
        </div>

        {/* Rolling Orb Chain */}
        {chain.map((orb) => {
          const pos = getPointAtDistance(track, orb.d)
          return (
            <div
              key={orb.id}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={cn(
                "pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm",
                ORB_COLORS[orb.color]
              )}
            />
          )
        })}

        {/* Aim Guide */}
        {!proj && (
          <div
            style={{
              left: `${track.shooter.x}%`,
              top: `${track.shooter.y}%`,
              transform: `translate(-50%, -100%) rotate(${aimAngle + Math.PI / 2}rad)`,
              transformOrigin: "bottom center",
            }}
            className="pointer-events-none absolute h-20 w-0.5 border-l-2 border-dashed border-white/40"
          />
        )}

        {/* Flying Orb */}
        {proj && (
          <div
            style={{ left: `${proj.x}%`, top: `${proj.y}%` }}
            className={cn(
              "pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md",
              ORB_COLORS[proj.color]
            )}
          />
        )}

        {/* Pet Shooter */}
        <div
          style={{
            left: `${track.shooter.x}%`,
            top: `${track.shooter.y}%`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative flex items-center justify-center">
            <Blobatar
              name={avatarSeed}
              size={58}
              expression={expression}
              animate="always"
            />
            {!proj && (
              <div
                style={{
                  transform: `translate(${Math.cos(aimAngle) * 26}px, ${Math.sin(aimAngle) * 26}px)`,
                }}
                className={cn(
                  "absolute size-5 rounded-full border-2 shadow-md",
                  ORB_COLORS[currentColor]
                )}
              />
            )}
          </div>
        </div>

        {/* Next Orb & Swap Button */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleSwapColors}
          className="absolute bottom-20 left-3 z-20 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <RefreshCw className="size-3" />
          <span>{t("pet.minigames.swap")}</span>
          <span
            className={cn(
              "inline-block size-4 rounded-full border",
              ORB_COLORS[nextColor]
            )}
          />
        </button>

        <p className="pointer-events-none absolute inset-x-4 bottom-14 z-20 text-center text-[11px] text-white/60">
          {t("pet.minigames.hints.zuma")}
        </p>
      </div>
  )
}

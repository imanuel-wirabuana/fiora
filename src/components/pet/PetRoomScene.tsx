import { useState } from "react"
import { motion } from "motion/react"
import type { PetRoomLayer, PetRoomTheme } from "@/lib/petRooms"
import { cn } from "@/lib/utils"

interface PetRoomSceneProps {
  theme: PetRoomTheme | null
  isSleeping: boolean
  interactiveDisabled?: boolean
}

const LAYER_Z: Record<PetRoomLayer, string> = {
  backdrop: "z-[1]",
  back: "z-[2]",
  mid: "z-[3]",
  front: "z-[4]",
}

export function PetRoomScene({
  theme,
  isSleeping,
  interactiveDisabled = false,
}: PetRoomSceneProps) {
  const [bouncedIdx, setBouncedIdx] = useState<number | null>(null)

  const handlePropTap = (idx: number) => {
    setBouncedIdx(idx)
    window.setTimeout(() => {
      setBouncedIdx((prev) => (prev === idx ? null : prev))
    }, 450)
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-colors duration-500",
        isSleeping
          ? "bg-gradient-to-b from-indigo-950/95 via-slate-900/95 to-indigo-950 text-indigo-50"
          : (theme?.background ??
              "bg-gradient-to-b from-primary/10 via-background to-primary/15")
      )}
    >
      {/* Top Sky / Ceiling Atmospheric Band */}
      {theme && !isSleeping && (
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[38%] transition-colors duration-500",
            theme.skyClass
          )}
        />
      )}

      {/* Horizon / Floor Band */}
      {theme && !isSleeping && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-[40%] transition-colors duration-500",
            theme.floorClass
          )}
        />
      )}

      {/* Subtle ambient focal glow behind pet */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-500",
          isSleeping
            ? "bg-indigo-500/15"
            : (theme?.ambientGlowClass ?? "bg-primary/10")
        )}
      />

      {/* Layered Emoji Decorations (strictly inside z-0 container behind PetCharacter z-10) */}
      {theme?.decorations.map((dec, idx) => {
        const isInteractive = Boolean(dec.interactive) && !interactiveDisabled
        const isBouncing = bouncedIdx === idx
        const baseFontSize = Math.round(20 * dec.scale)
        const baseRotate = dec.rotate ?? 0
        const baseOpacity = dec.opacity ?? 1

        const animateProp = isBouncing
          ? { scale: [1, 1.28, 0.94, 1], rotate: baseRotate }
          : dec.animation === "float"
            ? { y: [0, -6, 0], rotate: baseRotate }
            : dec.animation === "sway"
              ? {
                  rotate: [baseRotate - 4, baseRotate + 4, baseRotate - 4],
                }
              : dec.animation === "twinkle"
                ? {
                    opacity: [
                      baseOpacity * 0.75,
                      baseOpacity,
                      baseOpacity * 0.75,
                    ],
                    scale: [0.96, 1.06, 0.96],
                    rotate: baseRotate,
                  }
                : { rotate: baseRotate }

        const transitionProp = isBouncing
          ? { duration: 0.42 }
          : dec.animation && dec.animation !== "none"
            ? {
                duration: 3.4 + (idx % 3) * 0.7,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }
            : undefined

        return (
          <motion.div
            key={`${theme.id}-${idx}`}
            style={{
              left: `${dec.x}%`,
              top: `${dec.y}%`,
              fontSize: `${baseFontSize}px`,
              opacity: isSleeping ? baseOpacity * 0.35 : baseOpacity,
            }}
            initial={{ rotate: baseRotate }}
            animate={animateProp}
            transition={transitionProp}
            onClick={
              isInteractive
                ? (e) => {
                    e.stopPropagation()
                    handlePropTap(idx)
                  }
                : undefined
            }
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 leading-none select-none transition-opacity duration-500",
              LAYER_Z[dec.layer],
              isSleeping && "brightness-75",
              isInteractive && "pointer-events-auto cursor-pointer"
            )}
          >
            {dec.emoji}
          </motion.div>
        )
      })}
    </div>
  )
}

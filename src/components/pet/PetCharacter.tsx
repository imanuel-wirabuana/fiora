import type { PointerEvent as ReactPointerEvent, RefObject } from "react"
import { Blobatar } from "@blobatar/react"
import "blobatar/motion.css"
import {
  MoveDiagonal2,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { getPetConditionVisuals } from "@/lib/petLogic"
import { cn } from "@/lib/utils"
import type {
  PetCosmeticTransform,
  PetStats,
  PetWearableSlot,
} from "@/types/pet"
import {
  PetBathFoamOverlay,
  PetConditionOverlays,
  PetMouthOverlay,
  PetSleepBlanketOverlay,
} from "./PetOverlays"

export interface PetWearableRenderItem {
  emoji: string
  transform: PetCosmeticTransform
}

export type PetWearableGestureMode =
  | "move"
  | "resize-x"
  | "resize-y"
  | "resize-xy"
  | "rotate"

interface PetCharacterProps {
  avatarSeed: string
  expression: Parameters<typeof Blobatar>[0]["expression"]
  mouthMode?: "none" | "open" | "chew"
  isChewing?: boolean
  isPetting?: boolean
  isNearPet?: boolean
  isBathing?: boolean
  bathProgress?: number
  isSleeping?: boolean
  petLeanX?: number
  size?: number
  stats?: PetStats
  wearables?: Partial<Record<PetWearableSlot, PetWearableRenderItem | null>>
  isEditMode?: boolean
  selectedWearable?: PetWearableSlot | null
  onWearableGestureStart?: (
    slot: PetWearableSlot,
    mode: PetWearableGestureMode,
    e: ReactPointerEvent<HTMLElement>,
    center: { x: number; y: number }
  ) => void
  interactive?: boolean
  onTap?: () => void
  petRef?: RefObject<HTMLDivElement | null>
}

const WEARABLE_ORDER: PetWearableSlot[] = [
  "footwear",
  "clothes",
  "facewear",
  "headwear",
]

export function PetCharacter({
  avatarSeed,
  expression,
  mouthMode = "none",
  isChewing = false,
  isPetting = false,
  isNearPet = false,
  isBathing = false,
  bathProgress = 0,
  isSleeping = false,
  petLeanX = 0,
  size = 164,
  stats,
  wearables,
  isEditMode = false,
  selectedWearable = null,
  onWearableGestureStart,
  interactive = true,
  onTap,
  petRef,
}: PetCharacterProps) {
  const condition = stats ? getPetConditionVisuals(stats) : null
  const overfedScaleX = condition?.isOverfed ? condition.overfedScaleX : 1
  const overfedScaleY = condition?.isOverfed ? condition.overfedScaleY : 1

  const animateState = isChewing
    ? {
        scaleX: [1, 1.12, 0.94, 1.06, 1],
        scaleY: [1, 0.9, 1.08, 0.96, 1],
      }
    : isPetting
      ? {
          scale: [1, 1.1, 0.96, 1],
          rotate: [-4, 4, 0],
        }
      : isBathing && isNearPet
        ? {
            rotate: [-6, 6, -6],
            scale: [1, 1.04, 1],
          }
        : isSleeping
          ? {
              y: [0, 3, 0],
              scale: [1, 0.98, 1],
            }
          : condition?.isStarving
            ? {
                x: [-2.5, 2.5, -2, 2, 0],
                y: [0, 1, -1, 0],
              }
            : condition?.isMelting
              ? {
                  scaleX: [1.2, 1.26, 1.2],
                  scaleY: [0.74, 0.68, 0.74],
                  y: [
                    Math.round(size * 0.08),
                    Math.round(size * 0.11),
                    Math.round(size * 0.08),
                  ],
                }
              : {
                  x: petLeanX * 14,
                  rotate: petLeanX * 6,
                  y: [0, -5, 0],
                }

  const transitionConfig =
    isChewing || isPetting
      ? { duration: 0.45 }
      : condition?.isStarving && !isSleeping
        ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" as const }
        : { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const }

  return (
    <motion.div
      ref={petRef}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation()
              onTap?.()
            }
          : undefined
      }
      animate={animateState}
      transition={transitionConfig}
      className={cn(
        "relative z-10 flex items-center justify-center select-none",
        interactive
          ? !isSleeping && "cursor-pointer"
          : "pointer-events-none"
      )}
    >
      <div
        style={{
          transform: `scale(${overfedScaleX}, ${overfedScaleY})`,
        }}
        className="flex items-center justify-center transition-transform duration-500 ease-out"
      >
        <Blobatar
          name={avatarSeed}
          size={size}
          expression={expression}
          animate="always"
        />
      </div>

      {WEARABLE_ORDER.map((slot) => {
        if ((slot === "clothes" || slot === "footwear") && isSleeping) {
          return null
        }
        const item = wearables?.[slot]
        if (!item) return null
        const isSelected = isEditMode && selectedWearable === slot
        const isFootwear = slot === "footwear"
        const baseSize = Math.round(size * (isFootwear ? 0.26 : 0.34))
        const boxWidth = isFootwear ? Math.round(baseSize * 2.25) : baseSize
        const scaleX = item.transform.scaleX ?? item.transform.scale ?? 1
        const scaleY = item.transform.scaleY ?? item.transform.scale ?? 1
        const rotateDeg = item.transform.rotate ?? 0
        const flipX = Boolean(item.transform.flipX)

        const getWrapperCenter = (el: HTMLElement | null) => {
          if (!el) return { x: 0, y: 0 }
          const rect = el.getBoundingClientRect()
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }
        }

        return (
          <div
            key={slot}
            onPointerDown={(e) => {
              if (!isEditMode || !onWearableGestureStart) return
              e.stopPropagation()
              onWearableGestureStart(
                slot,
                "move",
                e,
                getWrapperCenter(e.currentTarget)
              )
            }}
            onClick={(e) => {
              if (isEditMode) e.stopPropagation()
            }}
            style={{
              left: "50%",
              top: "50%",
              width: `${Math.round(boxWidth * scaleX)}px`,
              height: `${Math.round(baseSize * scaleY)}px`,
              transform: `translate(calc(-50% + ${item.transform.x * size}px), calc(-50% + ${item.transform.y * size}px)) rotate(${rotateDeg}deg)`,
            }}
            className={cn(
              "absolute flex touch-none items-center justify-center select-none",
              isEditMode
                ? "cursor-grab active:cursor-grabbing"
                : "pointer-events-none",
              isSelected &&
                "z-20 rounded-xl ring-2 ring-dashed ring-primary ring-offset-4 ring-offset-transparent"
            )}
          >
            {isFootwear ? (
              <span
                style={{
                  fontSize: `${baseSize}px`,
                  transform: `scale(${scaleX}, ${scaleY})`,
                }}
                className="pointer-events-none inline-flex items-center justify-center gap-[0.25em] leading-none"
              >
                <span
                  className={cn(
                    "inline-block leading-none",
                    !flipX && "-scale-x-100"
                  )}
                >
                  {item.emoji}
                </span>
                <span
                  className={cn(
                    "inline-block leading-none",
                    flipX && "-scale-x-100"
                  )}
                >
                  {item.emoji}
                </span>
              </span>
            ) : (
              <span
                style={{
                  fontSize: `${baseSize}px`,
                  transform: `scale(${flipX ? -scaleX : scaleX}, ${scaleY})`,
                }}
                className="pointer-events-none inline-block leading-none"
              >
                {item.emoji}
              </span>
            )}

            {isSelected && onWearableGestureStart && (
              <>
                {/* Top Tilt / Rotate Handle */}
                <button
                  type="button"
                  aria-label="Tilt cosmetic"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onWearableGestureStart(
                      slot,
                      "rotate",
                      e,
                      getWrapperCenter(e.currentTarget.parentElement)
                    )
                  }}
                  className="absolute -top-10 left-1/2 flex size-8 -translate-x-1/2 touch-none cursor-grab items-center justify-center rounded-full border border-border bg-background text-primary shadow-md active:cursor-grabbing"
                >
                  <RotateCw className="size-4" />
                </button>

                {/* Right Width Stretch Handle */}
                <button
                  type="button"
                  aria-label="Stretch width"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onWearableGestureStart(
                      slot,
                      "resize-x",
                      e,
                      getWrapperCenter(e.currentTarget.parentElement)
                    )
                  }}
                  className="absolute top-1/2 -right-5 flex size-8 -translate-y-1/2 touch-none cursor-ew-resize items-center justify-center rounded-full border border-border bg-background text-primary shadow-md"
                >
                  <MoveHorizontal className="size-4" />
                </button>

                {/* Bottom Height Stretch Handle */}
                <button
                  type="button"
                  aria-label="Stretch height"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onWearableGestureStart(
                      slot,
                      "resize-y",
                      e,
                      getWrapperCenter(e.currentTarget.parentElement)
                    )
                  }}
                  className="absolute -bottom-5 left-1/2 flex size-8 -translate-x-1/2 touch-none cursor-ns-resize items-center justify-center rounded-full border border-border bg-background text-primary shadow-md"
                >
                  <MoveVertical className="size-4" />
                </button>

                {/* Bottom-Right Free Stretch Handle */}
                <button
                  type="button"
                  aria-label="Stretch width and height"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onWearableGestureStart(
                      slot,
                      "resize-xy",
                      e,
                      getWrapperCenter(e.currentTarget.parentElement)
                    )
                  }}
                  className="absolute -right-4 -bottom-4 flex size-8 touch-none cursor-nwse-resize items-center justify-center rounded-full border border-border bg-background text-primary shadow-md"
                >
                  <MoveDiagonal2 className="size-4" />
                </button>
              </>
            )}
          </div>
        )
      })}

      <AnimatePresence>
        <PetMouthOverlay mode={mouthMode} />
        {isBathing && <PetBathFoamOverlay progress={bathProgress} />}
        {isSleeping && <PetSleepBlanketOverlay size={size} />}
      </AnimatePresence>

      <PetConditionOverlays
        stats={stats}
        size={size}
        isSleeping={isSleeping}
      />
    </motion.div>
  )
}

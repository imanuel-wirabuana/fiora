import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react"
import { Check, RotateCcw } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { PET_ACTIVITIES, PET_STAGE_CONFIG } from "@/lib/petConfig"
import {
  clampCosmeticTransform,
  getCosmeticItem,
  getCosmeticTransform,
  getPetSizeForLevel,
  resolvePetExpression,
} from "@/lib/petLogic"
import { getRoomTheme } from "@/lib/petRooms"
import { cn } from "@/lib/utils"
import { usePetStore } from "@/stores/petStore"
import type {
  PetContent,
  PetCosmeticTransform,
  PetWearableSlot,
} from "@/types/pet"
import { PetCharacter, type PetWearableGestureMode } from "./PetCharacter"
import { PetParticles } from "./PetParticles"
import { PetRoomScene } from "./PetRoomScene"

interface PetStageProps {
  avatarSeed: string
  content: PetContent
  celebrationEmoji: string | null
  isEditMode: boolean
  selectedWearable: PetWearableSlot | null
  onSelectWearable: (slot: PetWearableSlot | null) => void
  onExitEditMode: () => void
  onCompleteCare: (mode: "eat" | "bath", emoji?: string) => void
  onUpdateCosmeticTransform: (
    slot: PetWearableSlot,
    transform: PetCosmeticTransform | null
  ) => void
  className?: string
}

export function PetStage({
  avatarSeed,
  content,
  celebrationEmoji,
  isEditMode,
  selectedWearable,
  onSelectWearable,
  onExitEditMode,
  onCompleteCare,
  onUpdateCosmeticTransform,
  className,
}: PetStageProps) {
  const { t } = useTranslation("space")
  const stageRef = useRef<HTMLDivElement>(null)
  const petRef = useRef<HTMLDivElement>(null)
  const lastScrubRef = useRef(0)

  const [wearableGesture, setWearableGesture] = useState<{
    slot: PetWearableSlot
    mode: PetWearableGestureMode
    startX: number
    startY: number
    centerX: number
    centerY: number
    startLocalDx: number
    startLocalDy: number
    startAngleDeg: number
    initial: PetCosmeticTransform
    current: PetCosmeticTransform
  } | null>(null)

  const [pinchGesture, setPinchGesture] = useState<{
    slot: PetWearableSlot
    startDist: number
    startAngleDeg: number
    startMidX: number
    startMidY: number
    initial: PetCosmeticTransform
    current: PetCosmeticTransform
  } | null>(null)

  const interactionProgress = usePetStore((s) => s.interactionProgress)
  const draggingItem = usePetStore((s) => s.draggingItem)
  const isNearPet = usePetStore((s) => s.isNearPet)
  const isChewing = usePetStore((s) => s.isChewing)
  const isPetting = usePetStore((s) => s.isPetting)
  const petLeanX = usePetStore((s) => s.petLeanX)

  const addInteractionProgress = usePetStore((s) => s.addInteractionProgress)
  const setActiveCareDrawer = usePetStore((s) => s.setActiveCareDrawer)
  const updateDraggingItem = usePetStore((s) => s.updateDraggingItem)
  const stopDraggingItem = usePetStore((s) => s.stopDraggingItem)
  const setNearPet = usePetStore((s) => s.setNearPet)
  const setChewing = usePetStore((s) => s.setChewing)
  const setPetting = usePetStore((s) => s.setPetting)
  const setPetLeanX = usePetStore((s) => s.setPetLeanX)
  const spawnParticles = usePetStore((s) => s.spawnParticles)

  const isNightSleep = Boolean(content.isSleeping)
  const activeCareMode = draggingItem?.mode ?? null
  const petSize = getPetSizeForLevel(content.level)

  const effectiveContent: PetContent = activeCareMode
    ? {
        ...content,
        activeActivity: {
          type: activeCareMode,
          startedAt: "",
          emoji: draggingItem?.emoji ?? "",
        },
      }
    : content

  const expression = resolvePetExpression(effectiveContent, {
    isNearPet,
    isChewing,
    isPetting,
  })

  // Floating Zzz particles while sleeping
  useEffect(() => {
    if (!isNightSleep) return
    const interval = window.setInterval(() => {
      spawnParticles(["💤", "🌙", "⭐"], 2, { x: 24, y: -32 })
    }, PET_STAGE_CONFIG.durationsMs.sleepParticles)
    return () => window.clearInterval(interval)
  }, [isNightSleep, spawnParticles])

  const getHitInfo = useCallback((clientX: number, clientY: number) => {
    const petEl = petRef.current
    const stageEl = stageRef.current
    if (!petEl || !stageEl) {
      return { near: false, leanX: 0, origin: { x: 0, y: 0 } }
    }
    const petRect = petEl.getBoundingClientRect()
    const stageRect = stageEl.getBoundingClientRect()
    const petCenterX = petRect.left + petRect.width / 2
    const petCenterY = petRect.top + petRect.height / 2
    const dx = clientX - petCenterX
    const dy = clientY - petCenterY
    const distance = Math.hypot(dx, dy)
    const near = distance < PET_STAGE_CONFIG.hitRadiusPx
    const leanX = Math.max(-1, Math.min(1, dx / 120))
    const origin = {
      x: clientX - (stageRect.left + stageRect.width / 2),
      y: clientY - (stageRect.top + stageRect.height / 2),
    }
    return { near, leanX, origin }
  }, [])

  // Track global pointer gesture when moving, stretching, or tilting a wearable
  useEffect(() => {
    if (!wearableGesture) return

    const onPointerMove = (e: PointerEvent) => {
      if (wearableGesture.mode === "move") {
        const dx = (e.clientX - wearableGesture.startX) / petSize
        const dy = (e.clientY - wearableGesture.startY) / petSize
        const next = clampCosmeticTransform({
          ...wearableGesture.initial,
          x: wearableGesture.initial.x + dx,
          y: wearableGesture.initial.y + dy,
        })
        setWearableGesture((prev) => (prev ? { ...prev, current: next } : null))
        return
      }

      if (
        wearableGesture.mode === "resize-x" ||
        wearableGesture.mode === "resize-y" ||
        wearableGesture.mode === "resize-xy"
      ) {
        const rad = (-(wearableGesture.initial.rotate ?? 0) * Math.PI) / 180
        const dx = e.clientX - wearableGesture.centerX
        const dy = e.clientY - wearableGesture.centerY
        const localDx = dx * Math.cos(rad) - dy * Math.sin(rad)
        const localDy = dx * Math.sin(rad) + dy * Math.cos(rad)

        const baseScaleX =
          wearableGesture.initial.scaleX ?? wearableGesture.initial.scale ?? 1
        const baseScaleY =
          wearableGesture.initial.scaleY ?? wearableGesture.initial.scale ?? 1

        const nextScaleX =
          wearableGesture.mode === "resize-x" ||
          wearableGesture.mode === "resize-xy"
            ? baseScaleX *
              (Math.abs(localDx) /
                Math.max(10, Math.abs(wearableGesture.startLocalDx)))
            : baseScaleX

        const nextScaleY =
          wearableGesture.mode === "resize-y" ||
          wearableGesture.mode === "resize-xy"
            ? baseScaleY *
              (Math.abs(localDy) /
                Math.max(10, Math.abs(wearableGesture.startLocalDy)))
            : baseScaleY

        const next = clampCosmeticTransform({
          ...wearableGesture.initial,
          scaleX: nextScaleX,
          scaleY: nextScaleY,
        })
        setWearableGesture((prev) => (prev ? { ...prev, current: next } : null))
        return
      }

      // mode === "rotate"
      const angleDeg =
        (Math.atan2(
          e.clientY - wearableGesture.centerY,
          e.clientX - wearableGesture.centerX
        ) *
          180) /
        Math.PI
      let delta = angleDeg - wearableGesture.startAngleDeg
      while (delta > 180) delta -= 360
      while (delta < -180) delta += 360
      let nextRotate = (wearableGesture.initial.rotate ?? 0) + delta
      while (nextRotate > 180) nextRotate -= 360
      while (nextRotate < -180) nextRotate += 360

      const next = clampCosmeticTransform({
        ...wearableGesture.initial,
        rotate: nextRotate,
      })
      setWearableGesture((prev) => (prev ? { ...prev, current: next } : null))
    }

    const onPointerUp = () => {
      onUpdateCosmeticTransform(wearableGesture.slot, wearableGesture.current)
      setWearableGesture(null)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [wearableGesture, petSize, onUpdateCosmeticTransform])

  // Track global pointer drag when dragging an item from Eat / Bath
  useEffect(() => {
    if (!draggingItem) return

    const onPointerMove = (e: PointerEvent) => {
      updateDraggingItem(e.clientX, e.clientY)
      const { near, leanX, origin } = getHitInfo(e.clientX, e.clientY)
      setNearPet(near)
      setPetLeanX(draggingItem.mode === "bath" ? leanX * 0.5 : leanX)

      if (draggingItem.mode === "bath" && near) {
        const bathInteraction = PET_ACTIVITIES.bath.interaction
        if (
          e.timeStamp - lastScrubRef.current >
          (bathInteraction?.cooldownMs ?? 160)
        ) {
          lastScrubRef.current = e.timeStamp
          spawnParticles([draggingItem.emoji, "🫧", "💦", "✨"], 3, origin)
          const next = addInteractionProgress(
            bathInteraction?.progressStep ?? 8
          )
          if (next >= 100) {
            const usedEmoji = draggingItem.emoji
            stopDraggingItem()
            window.setTimeout(
              () => onCompleteCare("bath", usedEmoji),
              bathInteraction?.completeDelayMs ?? 350
            )
          }
        }
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      const { near, origin } = getHitInfo(e.clientX, e.clientY)
      const { mode, emoji } = draggingItem
      stopDraggingItem()

      if (mode === "eat") {
        if (near) {
          const eatInteraction = PET_ACTIVITIES.eat.interaction
          setChewing(true)
          spawnParticles([emoji, "😋", "✨", "💫"], 7, origin)
          window.setTimeout(
            () => setChewing(false),
            PET_STAGE_CONFIG.durationsMs.chewing
          )
          const next = addInteractionProgress(
            eatInteraction?.progressStep ?? 25
          )
          if (next >= 100) {
            window.setTimeout(
              () => onCompleteCare("eat", emoji),
              eatInteraction?.completeDelayMs ?? 450
            )
          } else {
            setActiveCareDrawer("eat")
          }
        } else {
          setActiveCareDrawer("eat")
        }
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [
    draggingItem,
    getHitInfo,
    updateDraggingItem,
    stopDraggingItem,
    setNearPet,
    setPetLeanX,
    setChewing,
    spawnParticles,
    addInteractionProgress,
    setActiveCareDrawer,
    onCompleteCare,
  ])

  const handleIdlePetTap = () => {
    if (isEditMode || isNightSleep || draggingItem) return
    setPetting(true)
    spawnParticles(["💕", "✨", "💛"], 5, { x: 0, y: -18 })
    window.setTimeout(
      () => setPetting(false),
      PET_STAGE_CONFIG.durationsMs.petting
    )
  }

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!isEditMode || !selectedWearable || e.touches.length !== 2) return
    const [t1, t2] = [e.touches[0], e.touches[1]]
    const startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const startAngleDeg =
      (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) /
      Math.PI
    const initial = getCosmeticTransform(content, selectedWearable)
    setWearableGesture(null)
    setPinchGesture({
      slot: selectedWearable,
      startDist,
      startAngleDeg,
      startMidX: (t1.clientX + t2.clientX) / 2,
      startMidY: (t1.clientY + t2.clientY) / 2,
      initial,
      current: initial,
    })
  }

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!pinchGesture || e.touches.length !== 2) return
    const [t1, t2] = [e.touches[0], e.touches[1]]
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const angleDeg =
      (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) /
      Math.PI
    const midX = (t1.clientX + t2.clientX) / 2
    const midY = (t1.clientY + t2.clientY) / 2

    const ratio = dist / Math.max(16, pinchGesture.startDist)
    let deltaAngle = angleDeg - pinchGesture.startAngleDeg
    while (deltaAngle > 180) deltaAngle -= 360
    while (deltaAngle < -180) deltaAngle += 360
    let nextRotate = (pinchGesture.initial.rotate ?? 0) + deltaAngle
    while (nextRotate > 180) nextRotate -= 360
    while (nextRotate < -180) nextRotate += 360

    const baseScaleX =
      pinchGesture.initial.scaleX ?? pinchGesture.initial.scale ?? 1
    const baseScaleY =
      pinchGesture.initial.scaleY ?? pinchGesture.initial.scale ?? 1

    const next = clampCosmeticTransform({
      x: pinchGesture.initial.x + (midX - pinchGesture.startMidX) / petSize,
      y: pinchGesture.initial.y + (midY - pinchGesture.startMidY) / petSize,
      scaleX: baseScaleX * ratio,
      scaleY: baseScaleY * ratio,
      rotate: nextRotate,
    })
    setPinchGesture((prev) => (prev ? { ...prev, current: next } : null))
  }

  const handleTouchEnd = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!pinchGesture) return
    if (e.touches.length < 2) {
      onUpdateCosmeticTransform(pinchGesture.slot, pinchGesture.current)
      setPinchGesture(null)
    }
  }

  const handleWearableGestureStart = (
    slot: PetWearableSlot,
    mode: PetWearableGestureMode,
    e: ReactPointerEvent<HTMLElement>,
    center: { x: number; y: number }
  ) => {
    if (!isEditMode || draggingItem || pinchGesture) return
    e.preventDefault()
    onSelectWearable(slot)
    const initial = getCosmeticTransform(content, slot)
    const rad = (-(initial.rotate ?? 0) * Math.PI) / 180
    const dx = e.clientX - center.x
    const dy = e.clientY - center.y
    const startLocalDx = dx * Math.cos(rad) - dy * Math.sin(rad)
    const startLocalDy = dx * Math.sin(rad) + dy * Math.cos(rad)
    const startAngleDeg =
      (Math.atan2(dy, dx) * 180) / Math.PI
    setWearableGesture({
      slot,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      centerX: center.x,
      centerY: center.y,
      startLocalDx,
      startLocalDy,
      startAngleDeg,
      initial,
      current: initial,
    })
  }

  const roomTheme = getRoomTheme(content.cosmetics?.room)
  const headwearItem = getCosmeticItem("headwear", content.cosmetics?.headwear)
  const facewearItem = getCosmeticItem("facewear", content.cosmetics?.facewear)
  const clothesItem = getCosmeticItem("clothes", content.cosmetics?.clothes)

  const resolveWearable = (slot: PetWearableSlot, emoji?: string | null) => {
    if (!emoji) return null
    const transform =
      pinchGesture?.slot === slot
        ? pinchGesture.current
        : wearableGesture?.slot === slot
          ? wearableGesture.current
          : getCosmeticTransform(content, slot)
    return { emoji, transform }
  }

  const selectedTransform = selectedWearable
    ? pinchGesture?.slot === selectedWearable
      ? pinchGesture.current
      : wearableGesture?.slot === selectedWearable
        ? wearableGesture.current
        : getCosmeticTransform(content, selectedWearable)
    : null

  const equippedWearables: Array<{ slot: PetWearableSlot; emoji: string }> = [
    ...(headwearItem
      ? [{ slot: "headwear" as const, emoji: headwearItem.emoji }]
      : []),
    ...(facewearItem
      ? [{ slot: "facewear" as const, emoji: facewearItem.emoji }]
      : []),
    ...(clothesItem
      ? [{ slot: "clothes" as const, emoji: clothesItem.emoji }]
      : []),
  ]

  const mouthMode =
    activeCareMode === "eat"
      ? isChewing
        ? "chew"
        : isNearPet
          ? "open"
          : "none"
      : isChewing
        ? "chew"
        : "none"

  return (
    <div
      ref={stageRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "relative flex flex-1 items-center justify-center overflow-hidden",
        isEditMode && "touch-none",
        className
      )}
    >
      <PetRoomScene
        theme={roomTheme}
        isSleeping={isNightSleep}
        interactiveDisabled={isEditMode || Boolean(draggingItem)}
      />

      <PetParticles />

      {/* Centered Pet Character */}
      <div className="relative flex items-center justify-center">
        <PetCharacter
          petRef={petRef}
          avatarSeed={avatarSeed}
          size={petSize}
          wearables={{
            headwear: resolveWearable("headwear", headwearItem?.emoji),
            facewear: resolveWearable("facewear", facewearItem?.emoji),
            clothes: resolveWearable("clothes", clothesItem?.emoji),
          }}
          isEditMode={isEditMode}
          selectedWearable={selectedWearable}
          onWearableGestureStart={handleWearableGestureStart}
          expression={expression}
          mouthMode={mouthMode}
          isChewing={isChewing}
          isPetting={isPetting}
          isNearPet={isNearPet}
          isBathing={activeCareMode === "bath"}
          bathProgress={interactionProgress}
          isSleeping={isNightSleep}
          petLeanX={petLeanX}
          onTap={handleIdlePetTap}
        />

        {/* Completion celebration burst */}
        <AnimatePresence>
          {celebrationEmoji && !draggingItem && !isEditMode && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -80,
                scale: [0.6, 1.35, 1.1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="pointer-events-none absolute z-30 text-3xl select-none"
            >
              {celebrationEmoji} ✨
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Mode Floating Bottom Controls (Hint + Bar) */}
      {isEditMode && (
        <div className="pointer-events-none absolute inset-x-3 bottom-18 z-30 mx-auto flex max-w-md flex-col items-center gap-2">
          <span className="rounded-full bg-card/85 px-3.5 py-1 text-center text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md">
            {t("pet.cosmetics.editHint")}
          </span>

          <div
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/90 px-3 py-2 shadow-md backdrop-blur-md"
          >
          <div className="flex items-center gap-1.5">
            {equippedWearables.map(({ slot, emoji }) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectWearable(slot)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border border-border/50 text-lg transition-transform active:scale-95",
                  selectedWearable === slot
                    ? "bg-primary/15 ring-2 ring-primary"
                    : "bg-muted/50"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {selectedWearable && selectedTransform && (
              <span className="hidden text-[11px] font-medium tabular-nums text-muted-foreground sm:inline">
                {Math.round((selectedTransform.scaleX ?? 1) * 100)}%×
                {Math.round((selectedTransform.scaleY ?? 1) * 100)}% ·{" "}
                {selectedTransform.rotate ?? 0}°
              </span>
            )}
            {selectedWearable && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                title={t("pet.cosmetics.resetFit")}
                onClick={() =>
                  onUpdateCosmeticTransform(selectedWearable, null)
                }
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 rounded-full px-3 text-xs"
              onClick={onExitEditMode}
            >
              <Check className="size-3.5" />
              <span>{t("pet.cosmetics.done")}</span>
            </Button>
          </div>
          </div>
        </div>
      )}

      {/* Floating Dragged Item from Drawer */}
      {draggingItem && (
        <div
          style={{ left: draggingItem.x, top: draggingItem.y }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-125 text-5xl drop-shadow-md select-none"
        >
          {draggingItem.emoji}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import {
  PetActivityBar,
  PetAdoptCard,
  PetCareDrawer,
  PetCosmeticBar,
  PetCosmeticDrawer,
  PetHeader,
  PetMinigamePickerDrawer,
  PetStage,
  PetStatsPanel,
} from "@/components/pet"
import { Skeleton } from "@/components/ui/skeleton"
import { usePet } from "@/hooks/usePet"
import { PET_STAGE_CONFIG } from "@/lib/petConfig"
import {
  DEFAULT_PET_COSMETICS,
  canPetPlay,
  getEatCooldownRemainingMs,
} from "@/lib/petLogic"
import { usePetStore } from "@/stores/petStore"
import type {
  PetActivityType,
  PetCosmeticSlot,
  PetWearableSlot,
} from "@/types/pet"

export function VirtualPetsScreen() {
  const [, navigate] = useLocation()
  const [minigamePickerOpen, setMinigamePickerOpen] = useState(false)
  const [activeCosmeticSlot, setActiveCosmeticSlot] =
    useState<PetCosmeticSlot | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedWearable, setSelectedWearable] =
    useState<PetWearableSlot | null>(null)

  const {
    pet,
    content,
    isLoading,
    adoptPet,
    isAdopting,
    completeCare,
    equipCosmetic,
    updateCosmeticTransform,
    toggleSleep,
    renamePet,
    isUpdating,
  } = usePet()

  const activeCareDrawer = usePetStore((s) => s.activeCareDrawer)
  const setActiveCareDrawer = usePetStore((s) => s.setActiveCareDrawer)
  const startDraggingItem = usePetStore((s) => s.startDraggingItem)
  const celebrationEmoji = usePetStore((s) => s.celebrationEmoji)
  const clearCelebration = usePetStore((s) => s.clearCelebration)

  const [nowMs, setNowMs] = useState(() => Date.now())
  const eatCooldownMs = getEatCooldownRemainingMs(content, nowMs)
  const eatCooldownMinutes = Math.ceil(eatCooldownMs / 60_000)
  const playAllowed = canPetPlay(content)

  useEffect(() => {
    if (eatCooldownMs <= 0) return
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [eatCooldownMs])

  useEffect(() => {
    if (!celebrationEmoji) return
    const timeout = window.setTimeout(() => {
      clearCelebration()
    }, PET_STAGE_CONFIG.durationsMs.celebrationClear)
    return () => window.clearTimeout(timeout)
  }, [celebrationEmoji, clearCelebration])

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <PetAdoptCard onAdopt={adoptPet} isAdopting={isAdopting} />
      </div>
    )
  }

  const handleSelectActivity = (type: PetActivityType) => {
    if (type === "sleep") {
      toggleSleep()
      return
    }
    if (content.isSleeping) return

    if (type === "play") {
      if (!playAllowed) return
      setMinigamePickerOpen(true)
      return
    }
    if (type === "eat") {
      if (eatCooldownMs > 0) return
      setActiveCareDrawer("eat")
    }
  }

  const enterEditMode = (preferredSlot?: PetWearableSlot) => {
    const cosmetics = content.cosmetics ?? DEFAULT_PET_COSMETICS
    const fallbackSlot: PetWearableSlot | null = cosmetics.headwear
      ? "headwear"
      : cosmetics.facewear
        ? "facewear"
        : cosmetics.clothes
          ? "clothes"
          : null
    const target = preferredSlot ?? fallbackSlot
    if (!target) return
    setActiveCareDrawer(null)
    setActiveCosmeticSlot(null)
    setSelectedWearable(target)
    setIsEditMode(true)
  }

  const exitEditMode = () => {
    setIsEditMode(false)
    setSelectedWearable(null)
  }

  return (
    <div className="relative flex h-full min-h-[calc(100svh-3rem)] w-full flex-1 flex-col overflow-hidden md:min-h-0">
      {/* Full-page Pet Stage */}
      <PetStage
        avatarSeed={pet.unique_name}
        content={content}
        celebrationEmoji={celebrationEmoji}
        isEditMode={isEditMode}
        selectedWearable={selectedWearable}
        onSelectWearable={setSelectedWearable}
        onExitEditMode={exitEditMode}
        onCompleteCare={completeCare}
        onUpdateCosmeticTransform={updateCosmeticTransform}
        className="absolute inset-0"
      />

      {!isEditMode && (
        <>
          {/* Floating Header */}
          <PetHeader
            name={pet.name}
            level={content.level}
            xp={content.xp}
            onRename={renamePet}
            isUpdating={isUpdating}
            className="absolute inset-x-3 top-3 z-20 mx-auto max-w-md"
          />

          {/* Floating Vertical Cosmetic Bar on Left */}
          <PetCosmeticBar
            cosmetics={content.cosmetics ?? DEFAULT_PET_COSMETICS}
            activeSlot={activeCosmeticSlot}
            onSelect={setActiveCosmeticSlot}
            onEnterEditMode={() => enterEditMode()}
            className="absolute top-1/2 left-3 z-20 -translate-y-1/2"
          />

          {/* Floating Vertical Activity Bar on Right */}
          <PetActivityBar
            activeType={content.isSleeping ? "sleep" : activeCareDrawer}
            isSleeping={Boolean(content.isSleeping)}
            eatCooldownMinutes={eatCooldownMinutes}
            canPlay={playAllowed}
            onSelect={handleSelectActivity}
            onStartBathDrag={(x, y) =>
              startDraggingItem({
                mode: "bath",
                emoji: "🧼",
                x,
                y,
              })
            }
            className="absolute top-1/2 right-3 z-20 -translate-y-1/2"
          />

          {/* Floating Stats Panel at Bottom */}
          <PetStatsPanel
            stats={content.stats}
            className="absolute inset-x-3 bottom-18 z-20 mx-auto max-w-md"
          />
        </>
      )}

      {/* Custom Food Drawer (Eat) */}
      <PetCareDrawer
        open={activeCareDrawer === "eat"}
        onClose={() => setActiveCareDrawer(null)}
      />

      {/* Custom Minigame Picker Drawer (Play) */}
      <PetMinigamePickerDrawer
        open={minigamePickerOpen}
        onOpenChange={setMinigamePickerOpen}
        onSelect={(gameId) => navigate(`/space/virtual-pets/play/${gameId}`)}
      />

      {/* Custom Cosmetic Drawer */}
      <PetCosmeticDrawer
        slot={activeCosmeticSlot}
        equippedId={
          activeCosmeticSlot
            ? ((content.cosmetics ?? DEFAULT_PET_COSMETICS)[
                activeCosmeticSlot
              ] ?? null)
            : null
        }
        petLevel={content.level}
        onClose={() => setActiveCosmeticSlot(null)}
        onSelect={(slot, itemId) => {
          equipCosmetic(slot, itemId)
          if (slot !== "room" && itemId === null && selectedWearable === slot) {
            setSelectedWearable(null)
          }
        }}
        onAdjustFit={(slot) => enterEditMode(slot)}
      />
    </div>
  )
}

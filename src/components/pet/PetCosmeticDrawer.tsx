import { useState } from "react"
import { Lock, Move, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DrawerScopeContext } from "@/components/AnimationScopeContext"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { useDrawerAnimationPause } from "@/hooks/useDrawerAnimationPause"
import {
  PET_COSMETIC_ITEMS,
  PET_ROOMS,
  PET_UNLOCK_CONFIG,
  hasCustomSlotUnlocks,
  type PetRoomWithUnlock,
} from "@/lib/petConfig"
import { cn } from "@/lib/utils"
import type { PetCosmeticSlot, PetWearableSlot } from "@/types/pet"

interface PetCosmeticDrawerProps {
  slot: PetCosmeticSlot | null
  equippedId: string | null
  petLevel: number
  onClose: () => void
  onSelect: (slot: PetCosmeticSlot, itemId: string | null) => void
  onAdjustFit?: (slot: PetWearableSlot) => void
}

export function PetCosmeticDrawer({
  slot,
  equippedId,
  petLevel,
  onClose,
  onSelect,
  onAdjustFit,
}: PetCosmeticDrawerProps) {
  const { t } = useTranslation("space")
  const open = slot !== null
  useDrawerAnimationPause(open)
  const [previewRoom, setPreviewRoom] = useState<PetRoomWithUnlock | null>(null)

  const handleClose = () => {
    setPreviewRoom(null)
    onClose()
  }

  const items = slot && slot !== "room" ? PET_COSMETIC_ITEMS[slot] : []

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose()
      }}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto flex flex-col inset-x-0 bottom-0 m-0 rounded-b-none rounded-t-4xl border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md [--drawer-inset:0px]">
        <DrawerScopeContext.Provider value={true}>
          {slot && (
            <>
              <DrawerHeader className="items-center pb-2 text-center md:text-center">
                <DrawerTitle className="text-base font-semibold">
                  {t(`pet.cosmetics.slots.${slot}`)}
                </DrawerTitle>
                <DrawerDescription className="text-xs">
                  {hasCustomSlotUnlocks(slot)
                    ? t("pet.cosmetics.drawerDescriptionCustom")
                    : t("pet.cosmetics.drawerDescription", {
                        interval: PET_UNLOCK_CONFIG.globalStep,
                      })}
                </DrawerDescription>
              </DrawerHeader>

              {slot === "room" ? (
                <div className="flex flex-col gap-3 pb-2">
                  {previewRoom && (
                    <div className="relative rounded-2xl border border-border/60 bg-muted/40 p-3.5">
                      <button
                        type="button"
                        aria-label="Close preview"
                        onClick={() => setPreviewRoom(null)}
                        className="absolute top-2.5 right-2.5 rounded-full p-1 text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-3.5" />
                      </button>

                      <div className="flex items-start gap-3 pr-6">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background text-2xl">
                          {previewRoom.signatureEmoji}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">
                              {previewRoom.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              <Lock className="size-2.5" />
                              Lv. {previewRoom.unlockLevel}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {previewRoom.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-muted-foreground">
                            {t("pet.cosmetics.yourLevel", { level: petLevel })}
                          </span>
                          <span className="text-primary">
                            {t("pet.cosmetics.levelsToUnlock", {
                              count: Math.max(
                                1,
                                previewRoom.unlockLevel - petLevel
                              ),
                            })}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            100,
                            Math.round((petLevel / previewRoom.unlockLevel) * 100)
                          )}
                          className="h-1.5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid max-h-[60svh] grid-cols-4 gap-2.5 overflow-y-auto p-0.5">
                    {/* Free Default / No Room */}
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewRoom(null)
                        onSelect("room", null)
                        handleClose()
                      }}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5 text-xs font-medium select-none transition-transform hover:bg-muted active:scale-95",
                        equippedId === null &&
                          "ring-2 ring-primary ring-offset-1"
                      )}
                    >
                      <Plus className="size-5 opacity-75" />
                      <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                        {t("pet.cosmetics.default")}
                      </span>
                    </button>

                    {PET_ROOMS.map((room) => {
                      const isUnlocked = petLevel >= room.unlockLevel
                      const isEquipped = equippedId === room.id
                      const isPreviewing = previewRoom?.id === room.id

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => {
                            if (isUnlocked) {
                              setPreviewRoom(null)
                              onSelect("room", room.id)
                              handleClose()
                            } else {
                              setPreviewRoom(room)
                            }
                          }}
                          className={cn(
                            "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5 select-none transition-transform active:scale-95",
                            isUnlocked
                              ? "hover:bg-muted"
                              : "opacity-65 hover:opacity-85",
                            isEquipped && "ring-2 ring-primary ring-offset-1",
                            isPreviewing &&
                              !isEquipped &&
                              "ring-2 ring-muted-foreground/50 ring-offset-1"
                          )}
                        >
                          <span
                            className={cn(
                              "text-3xl leading-none",
                              !isUnlocked && "grayscale-[35%]"
                            )}
                          >
                            {room.signatureEmoji}
                          </span>
                          <span className="w-full truncate text-center text-[10px] font-medium text-foreground/85">
                            {room.name}
                          </span>

                          {!isUnlocked && (
                            <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground shadow-xs">
                              <Lock className="size-2.5" />
                              {room.unlockLevel}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  <div className="grid max-h-[60svh] grid-cols-4 gap-2.5 overflow-y-auto p-0.5">
                    {/* Free Default / Unequip */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(slot, null)
                        handleClose()
                      }}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5 text-xs font-medium select-none transition-transform hover:bg-muted active:scale-95",
                        equippedId === null &&
                          "ring-2 ring-primary ring-offset-1"
                      )}
                    >
                      <Plus className="size-5 opacity-75" />
                      <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                        {t("pet.cosmetics.default")}
                      </span>
                    </button>

                    {items.map((item) => {
                      const isUnlocked = petLevel >= item.unlockLevel
                      const isEquipped = equippedId === item.id

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!isUnlocked}
                          onClick={() => {
                            if (!isUnlocked) return
                            onSelect(slot, item.id)
                            handleClose()
                          }}
                          className={cn(
                            "relative flex aspect-square items-center justify-center rounded-2xl border border-border/50 bg-muted/40 p-1.5 select-none transition-transform",
                            isUnlocked
                              ? "hover:bg-muted active:scale-95"
                              : "cursor-not-allowed opacity-55",
                            isEquipped && "ring-2 ring-primary ring-offset-1"
                          )}
                        >
                          <span
                            className={cn(
                              "text-3xl leading-none",
                              !isUnlocked && "grayscale"
                            )}
                          >
                            {item.emoji}
                          </span>
                          {!isUnlocked && (
                            <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground shadow-xs">
                              <Lock className="size-2.5" />
                              {item.unlockLevel}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {equippedId && onAdjustFit && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 rounded-2xl"
                      onClick={() => {
                        handleClose()
                        onAdjustFit(slot)
                      }}
                    >
                      <Move className="size-4" />
                      <span>{t("pet.cosmetics.adjustFit")}</span>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </DrawerScopeContext.Provider>
      </DrawerContent>
    </Drawer>
  )
}

import { useTranslation } from "react-i18next"
import { DrawerScopeContext } from "@/components/AnimationScopeContext"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useDrawerAnimationPause } from "@/hooks/useDrawerAnimationPause"
import { PET_MINIGAME_LIST } from "@/lib/petConfig"
import { cn } from "@/lib/utils"
import type { PetMinigameId } from "@/types/pet"

interface PetMinigamePickerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (gameId: PetMinigameId) => void
}

export function PetMinigamePickerDrawer({
  open,
  onOpenChange,
  onSelect,
}: PetMinigamePickerDrawerProps) {
  const { t } = useTranslation("space")
  useDrawerAnimationPause(open)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent className="mx-auto flex flex-col inset-x-0 bottom-0 m-0 rounded-b-none rounded-t-4xl border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md [--drawer-inset:0px]">
        <DrawerScopeContext.Provider value={true}>
          <DrawerHeader className="items-center pb-2 text-center md:text-center">
            <DrawerTitle className="text-base font-semibold">
              {t("pet.minigames.pickerTitle")}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {t("pet.minigames.pickerDescription")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-2.5 pb-2">
            {PET_MINIGAME_LIST.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  onSelect(game.id)
                }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border border-border/50 px-4 py-3.5 text-left transition-transform active:scale-[0.98]",
                  game.tint
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none">{game.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">
                      {t(`pet.minigames.items.${game.id}.title`)}
                    </div>
                    <div className="text-xs opacity-75">
                      {t(`pet.minigames.items.${game.id}.description`)}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-background/70 px-2.5 py-0.5 text-[11px] font-semibold">
                  {game.initialLives
                    ? `${game.initialLives} ❤️`
                    : t("pet.minigames.endless")}
                </span>
              </button>
            ))}
          </div>
        </DrawerScopeContext.Provider>
      </DrawerContent>
    </Drawer>
  )
}

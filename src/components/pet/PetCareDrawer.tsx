import { useTranslation } from "react-i18next"
import { DrawerScopeContext } from "@/components/AnimationScopeContext"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { useDrawerAnimationPause } from "@/hooks/useDrawerAnimationPause"
import { PET_ACTIVITIES } from "@/lib/petConfig"
import { usePetStore } from "@/stores/petStore"

interface PetCareDrawerProps {
  open: boolean
  onClose: () => void
}

export function PetCareDrawer({ open, onClose }: PetCareDrawerProps) {
  const { t } = useTranslation("space")
  useDrawerAnimationPause(open)

  const interactionProgress = usePetStore((s) => s.interactionProgress)
  const startDraggingItem = usePetStore((s) => s.startDraggingItem)

  const items = PET_ACTIVITIES.eat.emojis

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      showSwipeHandle
    >
      <DrawerContent className="inset-x-0 bottom-0 m-0 mx-auto flex flex-col rounded-t-4xl rounded-b-none border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] [--drawer-inset:0px] sm:max-w-md">
        <DrawerScopeContext.Provider value={true}>
          <DrawerHeader className="items-center pb-2 text-center md:text-center">
            <DrawerTitle className="text-base font-semibold">
              {t("pet.activities.eat")}
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              {t("pet.interactive.eat")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="mb-3 px-2">
            <Progress value={interactionProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-4 gap-2.5 pb-2">
            {items.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  startDraggingItem({
                    mode: "eat",
                    emoji,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }}
                className="flex aspect-square cursor-grab touch-none items-center justify-center rounded-2xl border border-border/50 bg-muted/40 text-3xl transition-transform select-none hover:bg-muted active:scale-95 active:cursor-grabbing"
              >
                {emoji}
              </button>
            ))}
          </div>
        </DrawerScopeContext.Provider>
      </DrawerContent>
    </Drawer>
  )
}

import * as React from "react"
import { Check } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface PickerDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  trigger?: React.ReactElement
  onConfirm: () => void
  confirmLabel?: string
  successLabel?: string
  children: React.ReactNode
}

export function PickerDrawer({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  onConfirm,
  confirmLabel = "Done",
  successLabel = "Saved!",
  children,
}: PickerDrawerProps) {
  const [isSuccess, setIsSuccess] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (!next && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setIsSuccess(false)
    }
    onOpenChange(next)
  }

  const handleConfirmClick = () => {
    if (isSuccess) return
    onConfirm()
    setIsSuccess(true)
    timerRef.current = setTimeout(() => {
      setIsSuccess(false)
      onOpenChange(false)
      timerRef.current = null
    }, 500)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      {trigger ? <DrawerTrigger render={trigger} /> : null}

      {/* Tightly padded Drawer Content docked flush to bottom with safe area */}
      <DrawerContent className="mx-auto flex flex-col inset-x-0 bottom-0 m-0 rounded-b-none rounded-t-4xl border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md [--drawer-inset:0px]">
        {(title || description) && (
          <DrawerHeader className="items-center pb-1 text-center md:text-center">
            {title && (
              <DrawerTitle className="text-base font-semibold">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-xs">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}

        <div className="px-1 py-2">{children}</div>

        <div className="p-1 pt-1 pb-0.5">
          <button
            type="button"
            disabled={isSuccess}
            onClick={handleConfirmClick}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-medium text-primary-foreground shadow-xs transition active:scale-[0.99]",
              isSuccess
                ? "bg-emerald-500"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isSuccess ? (
              <>
                <Check className="size-4" />
                <span>{successLabel}</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

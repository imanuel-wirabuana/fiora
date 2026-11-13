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
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface FormDrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  title: string
  description?: string
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void | boolean | Promise<void | boolean>
  submitLabel?: string
  successLabel?: string
  isPending?: boolean
  submitDisabled?: boolean
  children: React.ReactNode
}

export function FormDrawer({
  open: controlledOpen,
  onOpenChange,
  trigger,
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  successLabel = "Saved!",
  isPending = false,
  submitDisabled = false,
  children,
}: FormDrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOpen = controlledOpen ?? uncontrolledOpen

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange]
  )

  const handleOpenChange = (next: boolean) => {
    if (!next && timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      setIsSuccess(false)
    }
    setOpen(next)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSuccess || isPending || submitDisabled) return

    const result = await onSubmit(e)
    if (result === false) return

    setIsSuccess(true)
    timerRef.current = setTimeout(() => {
      setIsSuccess(false)
      setOpen(false)
      timerRef.current = null
    }, 500)
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange} showSwipeHandle>
      {trigger ? <DrawerTrigger render={trigger} /> : null}

      {/* Tightly padded Drawer Content docked flush to bottom with safe area */}
      <DrawerContent className="inset-x-0 bottom-0 m-0 mx-auto flex flex-col rounded-t-4xl rounded-b-none border-b-0 p-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] [--drawer-inset:0px] sm:max-w-md">
        <form onSubmit={handleFormSubmit} className="flex flex-col">
          <DrawerHeader className="items-center pb-1 text-center md:text-center">
            <DrawerTitle className="text-base font-semibold">
              {title}
            </DrawerTitle>
            {description ? (
              <DrawerDescription className="text-xs">
                {description}
              </DrawerDescription>
            ) : null}
          </DrawerHeader>

          <div className="flex flex-col gap-3 px-1 py-3">{children}</div>

          <div className="p-1 pt-1 pb-0.5">
            <button
              type="submit"
              disabled={isSuccess || isPending || submitDisabled}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-medium text-primary-foreground shadow-xs transition active:scale-[0.99] disabled:pointer-events-none",
                isSuccess
                  ? "bg-emerald-500"
                  : "bg-primary hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {isSuccess ? (
                <>
                  <Check className="size-4" />
                  <span>{successLabel}</span>
                </>
              ) : isPending ? (
                <Spinner className="size-4" />
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

import { useEffect, useState } from "react"
import { Brand } from "@/components/Brand"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface SplashScreenProps {
  isVisible?: boolean
}

export function SplashScreen({ isVisible = true }: SplashScreenProps) {
  const [isUnmounted, setIsUnmounted] = useState(false)

  useEffect(() => {
    if (isVisible) return

    const timer = window.setTimeout(() => {
      setIsUnmounted(true)
    }, 320)

    return () => window.clearTimeout(timer)
  }, [isVisible])

  if (!isVisible && isUnmounted) {
    return null
  }

  return (
    <div
      aria-hidden={!isVisible}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !isVisible) {
          setIsUnmounted(true)
        }
      }}
      className={cn(
        "absolute inset-0 z-50 flex min-h-full w-full flex-col items-center justify-between bg-primary p-8 text-primary-foreground transition-all duration-300 ease-out",
        isVisible
          ? "opacity-100 scale-100"
          : "pointer-events-none opacity-0 scale-[1.02]"
      )}
    >
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative flex size-24 items-center justify-center rounded-3xl bg-primary-foreground/15 p-3 shadow-lg shadow-black/5 ring-1 ring-white/20 backdrop-blur-md">
          <img
            src="/pwa-192x192.png"
            alt="Fiora Logo"
            className="size-16 rounded-2xl object-cover shadow-sm transition-transform duration-700 hover:scale-105"
          />
        </div>
        <Brand
          size="lg"
          align="center"
          subtitle="Mood tracker for couples"
          className="text-primary-foreground"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-end pb-8">
        <div className="flex items-center gap-2.5 text-xs font-medium tracking-wide text-primary-foreground/80">
          <Spinner className="size-4 text-primary-foreground" />
          <span>Loading your relationship...</span>
        </div>
      </div>
    </div>
  )
}

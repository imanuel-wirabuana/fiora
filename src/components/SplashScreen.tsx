import { Brand } from "@/components/Brand"
import { Spinner } from "@/components/ui/spinner"

export function SplashScreen() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-between bg-primary p-8 text-primary-foreground">
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
          <span>Loading your space...</span>
        </div>
      </div>
    </div>
  )
}

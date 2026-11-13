import type { ReactNode } from "react"
import { Heart, Smartphone, Sparkles, ShieldCheck } from "lucide-react"
import { Brand } from "./Brand"
import { PhoneMockup } from "./PhoneMockup"

export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh max-h-svh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 lg:p-8">
      <div className="mx-auto grid h-full max-h-[920px] w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left column: App Description & PWA Notice */}
        <div className="space-y-6 lg:col-span-7">
          <Brand
            align="left"
            size="lg"
            subtitle="Track your moods and stay close together"
          />

          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Fiora is a private relationship app designed exclusively for couples to track
            daily feelings, understand emotional rhythms, and connect deeper
            without pressure.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5 backdrop-blur-xs">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Heart className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold">Mood In Sync</h3>
                <p className="text-xs text-muted-foreground">
                  Share subtle mood updates instantly with your partner.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5 backdrop-blur-xs">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold">Couple Timeline</h3>
                <p className="text-xs text-muted-foreground">
                  Relive milestones and track shared memories together.
                </p>
              </div>
            </div>
          </div>

          {/* PWA Mobile Notice Card */}
          <div className="flex items-start gap-3.5 rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
              <Smartphone className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Install as Mobile App (PWA)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <ShieldCheck className="size-3" />
                  No App Store needed
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Open <span className="font-semibold text-foreground">fiora</span> in your mobile
                browser and tap{" "}
                <span className="font-semibold text-foreground">"Add to Home Screen"</span> to
                install the PWA for the full couple experience.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Realistic Phone Mockup */}
        <div className="flex justify-center lg:col-span-5">
          <PhoneMockup>{children}</PhoneMockup>
        </div>
      </div>
    </div>
  )
}

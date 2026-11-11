import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react"
import { useBattery, useNetworkState } from "@uidotdev/usehooks"
import { PhonePortalContext } from "./PhonePortalContext"
import { cn } from "../lib/utils"

interface PhoneMockupProps {
  children: ReactNode
  className?: string
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  const displayRef = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      )
    }
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const battery = useBattery()
  const { online } = useNetworkState()
  const { loading, level, charging } = battery ?? {}

  function getBatteryIcon() {
    const iconClass = "size-3.5 stroke-[2.4]"

    if (loading || level === null || level === undefined) {
      return <BatteryFull className={iconClass} />
    }

    if (charging) {
      return <BatteryCharging className={cn(iconClass, "text-emerald-500")} />
    }

    if (level >= 0.85) {
      return <BatteryFull className={iconClass} />
    }

    if (level >= 0.5) {
      return <BatteryMedium className={iconClass} />
    }

    if (level >= 0.2) {
      return <BatteryLow className={iconClass} />
    }

    return <Battery className={cn(iconClass, "text-primary")} />
  }

  const batteryPercent =
    level !== null && level !== undefined ? Math.round(level * 100) : null

  return (
    <div className={cn("relative mx-auto select-none", className)}>
      {/* Hardware Buttons - Sleek & Subtle Protrusions */}
      {/* Left: Action Button */}
      <div className="absolute top-28 -left-[2.5px] z-0 h-7 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
      {/* Left: Volume Up */}
      <div className="absolute top-40 -left-[2.5px] z-0 h-12 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
      {/* Left: Volume Down */}
      <div className="absolute top-56 -left-[2.5px] z-0 h-12 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />

      {/* Right: Power / Side Button */}
      <div className="absolute top-44 -right-[2.5px] z-0 h-16 w-[2.5px] rounded-r-full bg-neutral-600 shadow-xs" />
      {/* Right: Camera Control */}
      <div className="absolute top-[480px] -right-[2.5px] z-0 h-14 w-[2.5px] rounded-r-full bg-neutral-700 shadow-xs" />

      {/* Ultra-Slim Titanium Chassis (Slimmer, elongated iPhone 19.5:9 proportion) */}
      <div className="relative h-[720px] max-h-[88vh] w-[342px] rounded-[3.4rem] bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 p-[2.5px] shadow-[0_35px_80px_-20px_rgba(0,0,0,0.5),0_10px_25px_-10px_rgba(0,0,0,0.3)]">
        {/* Subtle Frame Edge Highlight */}
        <div className="pointer-events-none absolute inset-[1px] rounded-[3.3rem] border border-white/20" />

        {/* Razor-Thin Black Screen Border */}
        <div className="relative h-full w-full rounded-[3.25rem] bg-neutral-950 p-[2.5px]">
          {/* Main Display Container */}
          <div
            ref={displayRef}
            className="relative isolate h-full w-full [transform:translateZ(0)] overflow-hidden rounded-[3.1rem] bg-background"
            style={{ transform: "translateZ(0)" }}
          >
            <PhonePortalContext.Provider value={displayRef}>
              {/* Top Status Bar: Time & Indicators */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-11 items-center justify-between px-7 pt-1 text-[11px] font-semibold tracking-tight text-foreground">
                <span>{time}</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="size-3 stroke-[2.4]" />
                  {online ? (
                    <Wifi className="size-3 stroke-[2.4]" />
                  ) : (
                    <WifiOff className="size-3 stroke-[2.4]" />
                  )}
                  <div className="flex items-center gap-1">
                    {batteryPercent !== null ? (
                      <span className="text-[10px] leading-none font-medium">
                        {batteryPercent}%
                      </span>
                    ) : null}
                    {getBatteryIcon()}
                  </div>
                </div>
              </div>

              {/* Dynamic Island - Slim, Authentic Pro Pill */}
              <div className="pointer-events-none absolute top-[9px] left-1/2 z-[60] flex h-[26px] w-[104px] -translate-x-1/2 items-center justify-between rounded-full border border-white/[0.08] bg-black px-3 shadow-md">
                {/* Front Camera Lens */}
                <div className="relative flex size-[11px] items-center justify-center rounded-full bg-[#111827] ring-1 ring-white/[0.08]">
                  <div className="size-[5px] rounded-full bg-gradient-to-br from-indigo-400/40 via-blue-900 to-black" />
                  <div className="absolute top-[2px] left-[2px] size-[2px] rounded-full bg-white/30 blur-[0.5px]" />
                </div>
                {/* Sensor */}
                <div className="mr-0.5 size-1 rounded-full bg-[#151515]" />
              </div>

              {/* Screen Content Wrapper: Provides safe internal clearance so hardware UI never overlaps app content */}
              <div
                className="relative h-full w-full [transform:translateZ(0)] overflow-hidden pt-10 pb-5"
                style={{ transform: "translateZ(0)" }}
              >
                {children}
              </div>

              {/* Subtle Screen Glass Sheen */}
              <div className="pointer-events-none absolute inset-0 z-40 rounded-[3.1rem] bg-gradient-to-br from-white/[0.035] via-transparent to-transparent" />

              {/* Bottom Home Indicator Bar */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-1.5">
                <div className="h-[4px] w-[120px] rounded-full bg-foreground/60 backdrop-blur-xs" />
              </div>
            </PhonePortalContext.Provider>
          </div>
        </div>
      </div>
    </div>
  )
}

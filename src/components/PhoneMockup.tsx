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

function formatPhoneTime() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function PhoneClock() {
  const [time, setTime] = useState(formatPhoneTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        const next = formatPhoneTime()
        return prev === next ? prev : next
      })
    }, 15_000)
    return () => clearInterval(interval)
  }, [])

  return <span>{time}</span>
}

function PhoneStatusIndicators() {
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
    <div className="flex items-center gap-1.5">
      <Signal className="size-3.5 stroke-[2.4]" />
      {online ? (
        <Wifi className="size-3.5 stroke-[2.4]" />
      ) : (
        <WifiOff className="size-3.5 stroke-[2.4]" />
      )}
      <div className="flex items-center gap-1">
        {batteryPercent !== null ? (
          <span className="text-[11px] leading-none font-medium">
            {batteryPercent}%
          </span>
        ) : null}
        {getBatteryIcon()}
      </div>
    </div>
  )
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  const displayRef = useRef<HTMLDivElement>(null)

  return (
    <div className={cn("relative mx-auto select-none", className)}>
      {/* Hardware Buttons - Sleek & Subtle Protrusions */}
      {/* Left: Action Button */}
      <div className="absolute top-28 -left-[2.5px] z-0 h-8 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
      {/* Left: Volume Up */}
      <div className="absolute top-40 -left-[2.5px] z-0 h-14 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
      {/* Left: Volume Down */}
      <div className="absolute top-58 -left-[2.5px] z-0 h-14 w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />

      {/* Right: Power / Side Button */}
      <div className="absolute top-44 -right-[2.5px] z-0 h-18 w-[2.5px] rounded-r-full bg-neutral-600 shadow-xs" />
      {/* Right: Camera Control */}
      <div className="absolute top-[520px] -right-[2.5px] z-0 h-16 w-[2.5px] rounded-r-full bg-neutral-700 shadow-xs" />

      {/* 
        Standard 1:1 Scale iPhone Chassis:
        Display Viewport: 393px width x 852px height (iPhone 15 / 16 / Pro standard viewport)
        Chassis: ~405px width with ~6px bezel border padding
      */}
      <div className="relative h-[852px] max-h-[92vh] w-[405px] max-w-[calc(100vw-2rem)] aspect-[393/852] rounded-[3.6rem] bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 p-[6px] shadow-[0_35px_80px_-20px_rgba(0,0,0,0.5),0_10px_25px_-10px_rgba(0,0,0,0.3)]">
        {/* Frame Edge Highlight */}
        <div className="pointer-events-none absolute inset-[1.5px] rounded-[3.5rem] border border-white/20" />

        {/* Razor-Thin Black Inner Screen Border */}
        <div className="relative h-full w-full rounded-[3.35rem] bg-neutral-950 p-[3px]">
          {/* Main 1:1 Display Viewport Container with containment for fixed children */}
          <div
            ref={displayRef}
            className="relative isolate h-full w-full overflow-hidden rounded-[3.2rem] bg-background [contain:paint_layout] [transform:translateZ(0)]"
          >
            <PhonePortalContext.Provider value={displayRef}>
              {/* Top Status Bar: Time & Indicators (44px standard iOS status height) */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-11 items-center justify-between px-8 pt-1 text-[12px] font-semibold tracking-tight text-foreground">
                <PhoneClock />
                <PhoneStatusIndicators />
              </div>

              {/* Dynamic Island Pill */}
              <div className="pointer-events-none absolute top-[10px] left-1/2 z-[60] flex h-[28px] w-[114px] -translate-x-1/2 items-center justify-between rounded-full border border-white/[0.08] bg-black px-3.5 shadow-md">
                {/* Front Camera Lens */}
                <div className="relative flex size-[11px] items-center justify-center rounded-full bg-[#111827] ring-1 ring-white/[0.08]">
                  <div className="size-[5px] rounded-full bg-gradient-to-br from-indigo-400/40 via-blue-900 to-black" />
                  <div className="absolute top-[2px] left-[2px] size-[2px] rounded-full bg-white/30 blur-[0.5px]" />
                </div>
                {/* Sensor */}
                <div className="mr-0.5 size-1 rounded-full bg-[#151515]" />
              </div>

              {/* 
                Screen Content:
                1:1 scale with actual mobile viewport.
                pt-11 reserves clearance for the 44px status bar / dynamic island,
                pb-5 leaves space for the home indicator.
              */}
              <div className="relative h-full w-full overflow-hidden pt-11 pb-5">
                {children}
              </div>

              {/* Screen Glass Sheen */}
              <div className="pointer-events-none absolute inset-0 z-40 rounded-[3.2rem] bg-gradient-to-br from-white/[0.035] via-transparent to-transparent" />

              {/* Bottom Home Indicator Bar */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-2">
                <div className="h-[4.5px] w-[134px] rounded-full bg-foreground/60 backdrop-blur-xs" />
              </div>
            </PhonePortalContext.Provider>
          </div>
        </div>
      </div>
    </div>
  )
}

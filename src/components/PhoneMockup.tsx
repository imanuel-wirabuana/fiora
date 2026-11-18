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
import { usePhoneScale } from "../hooks/usePhoneScale"
import { cn } from "../lib/utils"

// Real iPhone 15 / 16 / 16 Pro logical viewport (393x852) + 8px uniform bezel per side
const SCREEN_WIDTH = 393
const SCREEN_HEIGHT = 852
const BEZEL_SIZE = 8
const CHASSIS_WIDTH = SCREEN_WIDTH + BEZEL_SIZE * 2 // 409px
const CHASSIS_HEIGHT = SCREEN_HEIGHT + BEZEL_SIZE * 2 // 868px

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
  const scale = usePhoneScale(CHASSIS_WIDTH, CHASSIS_HEIGHT)

  return (
    <div
      className={cn("relative mx-auto shrink-0 select-none", className)}
      style={{
        width: CHASSIS_WIDTH * scale,
        height: CHASSIS_HEIGHT * scale,
      }}
    >
      <div
        className="relative origin-top-left"
        style={{
          width: CHASSIS_WIDTH,
          height: CHASSIS_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {/* Hardware Buttons - Sleek & Subtle Protrusions */}
        {/* Left: Action Button */}
        <div className="absolute top-[132px] -left-[2.5px] z-0 h-[30px] w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
        {/* Left: Volume Up */}
        <div className="absolute top-[184px] -left-[2.5px] z-0 h-[56px] w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />
        {/* Left: Volume Down */}
        <div className="absolute top-[254px] -left-[2.5px] z-0 h-[56px] w-[2.5px] rounded-l-full bg-neutral-600 shadow-xs" />

        {/* Right: Power / Side Button */}
        <div className="absolute top-[206px] -right-[2.5px] z-0 h-[82px] w-[2.5px] rounded-r-full bg-neutral-600 shadow-xs" />
        {/* Right: Camera Control */}
        <div className="absolute top-[520px] -right-[2.5px] z-0 h-[64px] w-[2.5px] rounded-r-full bg-neutral-700 shadow-xs" />

        {/*
          True 1:1 Scale iPhone 15 / 16 / 16 Pro Chassis:
          Inner Display Viewport: 393px x 852px
          Bezel: 5px titanium outer frame + 3px inner black border = 8px per side (409px x 868px)
        */}
        <div className="relative h-full w-full rounded-[60px] bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 p-[5px] shadow-[0_35px_80px_-20px_rgba(0,0,0,0.5),0_10px_25px_-10px_rgba(0,0,0,0.3)]">
          {/* Frame Edge Highlight */}
          <div className="pointer-events-none absolute inset-[1.5px] rounded-[58.5px] border border-white/20" />

          {/* Razor-Thin Black Inner Screen Border */}
          <div className="relative h-full w-full rounded-[55px] bg-neutral-950 p-[3px]">
            {/* Main 1:1 Display Viewport Container with containment for fixed children */}
            <div
              ref={displayRef}
              className="phone-viewport relative isolate h-full w-full overflow-hidden rounded-[52px] bg-background [contain:paint_layout] [transform:translateZ(0)]"
            >
              <PhonePortalContext.Provider value={displayRef}>
                {/* Top Status Bar: Time & Indicators (54px iOS Dynamic Island bar) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-[54px] items-center justify-between px-7 text-[13px] font-semibold tracking-tight text-foreground">
                  <PhoneClock />
                  <PhoneStatusIndicators />
                </div>

                {/* Dynamic Island Pill */}
                <div className="pointer-events-none absolute top-[10px] left-1/2 z-[60] flex h-[34px] w-[120px] -translate-x-1/2 items-center justify-between rounded-full border border-white/[0.08] bg-black px-3.5 shadow-md">
                  {/* Front Camera Lens */}
                  <div className="relative flex size-[12px] items-center justify-center rounded-full bg-[#111827] ring-1 ring-white/[0.08]">
                    <div className="size-[5.5px] rounded-full bg-gradient-to-br from-indigo-400/40 via-blue-900 to-black" />
                    <div className="absolute top-[2px] left-[2px] size-[2px] rounded-full bg-white/30 blur-[0.5px]" />
                  </div>
                  {/* Sensor */}
                  <div className="mr-0.5 size-1 rounded-full bg-[#151515]" />
                </div>

                {/*
                  Screen Content:
                  1:1 scale with actual mobile viewport (393x852).
                  pt-[52px] reserves clearance for the status bar / Dynamic Island,
                  pb-5 leaves space for the home indicator.
                */}
                <div className="relative h-full w-full overflow-hidden pt-[52px] pb-5">
                  {children}
                </div>

                {/* Screen Glass Sheen */}
                <div className="pointer-events-none absolute inset-0 z-40 rounded-[52px] bg-gradient-to-br from-white/[0.035] via-transparent to-transparent" />

                {/* Bottom Home Indicator Bar */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-2">
                  <div className="h-[4.5px] w-[134px] rounded-full bg-foreground/60 backdrop-blur-xs" />
                </div>
              </PhonePortalContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

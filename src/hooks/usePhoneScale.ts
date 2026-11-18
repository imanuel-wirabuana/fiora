import { useEffect, useState } from "react"

function computeScale(chassisWidth: number, chassisHeight: number): number {
  if (typeof window === "undefined") return 1
  const maxHeight = window.innerHeight * 0.92
  const maxWidth = window.innerWidth - 32
  return Math.min(1, maxHeight / chassisHeight, maxWidth / chassisWidth)
}

/**
 * Computes a uniform scale factor so a fixed-dimension phone chassis
 * fits within the desktop viewport while preserving exact 1:1 proportions.
 */
export function usePhoneScale(chassisWidth: number, chassisHeight: number): number {
  const [scale, setScale] = useState(() =>
    computeScale(chassisWidth, chassisHeight)
  )

  useEffect(() => {
    const update = () => {
      const next = computeScale(chassisWidth, chassisHeight)
      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next))
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [chassisWidth, chassisHeight])

  return scale
}

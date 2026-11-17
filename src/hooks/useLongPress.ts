import { useCallback, useRef, useState } from "react"
import type { MouseEvent, PointerEvent } from "react"

interface UseLongPressOptions {
  disabled?: boolean
  thresholdMs?: number
  moveThresholdPx?: number
  onLongPress: () => void
}

export function useLongPress({
  disabled = false,
  thresholdMs = 420,
  moveThresholdPx = 8,
  onLongPress,
}: UseLongPressOptions) {
  const [isPressing, setIsPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  const didLongPressRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressing(false)
  }, [])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (disabled) return
      if (e.pointerType === "mouse" && e.button !== 0) return

      didLongPressRef.current = false
      startPointRef.current = { x: e.clientX, y: e.clientY }
      setIsPressing(true)

      timerRef.current = setTimeout(() => {
        timerRef.current = null
        didLongPressRef.current = true
        setIsPressing(false)
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10)
        }
        onLongPress()
      }, thresholdMs)
    },
    [disabled, onLongPress, thresholdMs]
  )

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!startPointRef.current || timerRef.current === null) return
      const dx = Math.abs(e.clientX - startPointRef.current.x)
      const dy = Math.abs(e.clientY - startPointRef.current.y)
      if (dx > moveThresholdPx || dy > moveThresholdPx) {
        clearTimer()
      }
    },
    [clearTimer, moveThresholdPx]
  )

  const onPointerUp = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const onPointerCancel = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const onContextMenu = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (disabled) return
      e.preventDefault()
      clearTimer()
      didLongPressRef.current = true
      onLongPress()
    },
    [clearTimer, disabled, onLongPress]
  )

  const consumeLongPress = useCallback(() => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false
      return true
    }
    return false
  }, [])

  return {
    isPressing,
    consumeLongPress,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onContextMenu,
    },
  }
}

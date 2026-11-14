import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "wouter"
import { presenceService } from "@/services/presenceService"
import { usePresenceStore } from "@/stores/presenceStore"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"

const ROUTE_ACTIVITY_MAP: Record<string, string> = {
  "/home": "Viewing Home",
  "/timeline": "Viewing Timeline",
  "/space/journal": "Reading Journal",
  "/space": "Exploring Space",
  "/journal": "Reading Journal",
  "/setting": "In Settings",
  "/notification": "Checking Notifications",
  "/location": "Viewing Location Map",
  "/quiz-summary": "Reviewing Daily Quiz",
}

const LAST_SEEN_THROTTLE_MS = 120_000

function resolveActivityLabel(
  pathname: string,
  customOverride: string | null,
  isHidden: boolean
): string {
  if (isHidden) {
    return "In the background"
  }
  if (customOverride) {
    return customOverride
  }
  const matchedEntry = Object.entries(ROUTE_ACTIVITY_MAP).find(([route]) =>
    pathname.startsWith(route)
  )
  return matchedEntry ? matchedEntry[1] : "Active in Fiora"
}

export function usePresenceTracker() {
  const { user, isAuthenticated } = useAuth()
  const { relationship, currentMember } = useRelationship()
  const [location] = useLocation()

  const customActivityOverride = usePresenceStore(
    (s) => s.customActivityOverride
  )
  const setPartnerPresence = usePresenceStore((s) => s.setPartnerPresence)
  const setLastDisconnectedAt = usePresenceStore((s) => s.setLastDisconnectedAt)
  const resetPresence = usePresenceStore((s) => s.resetPresence)

  const [isHidden, setIsHidden] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.visibilityState === "hidden"
      : false
  )

  const currentMemberId = currentMember?.id
  const userId = user?.id
  const relationshipId = relationship?.id

  const channelRef = useRef<ReturnType<
    typeof presenceService.createPresenceChannel
  > | null>(null)
  const onlineAtRef = useRef<string>(new Date().toISOString())
  const lastPersistedAtRef = useRef<number>(0)

  const activity = useMemo(
    () => resolveActivityLabel(location, customActivityOverride, isHidden),
    [location, customActivityOverride, isHidden]
  )

  const activityRef = useRef(activity)
  const userIdRef = useRef(userId)
  const isHiddenRef = useRef(isHidden)

  useEffect(() => {
    activityRef.current = activity
  }, [activity])

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    isHiddenRef.current = isHidden
  }, [isHidden])

  const persistLastSeen = useCallback(
    (force = false, activityLabel?: string) => {
      if (!currentMemberId) return
      const nowMs = Date.now()
      if (!force && nowMs - lastPersistedAtRef.current < LAST_SEEN_THROTTLE_MS) {
        return
      }
      lastPersistedAtRef.current = nowMs
      void presenceService
        .updateMemberLastSeen(currentMemberId, {
          last_seen_at: new Date(nowMs).toISOString(),
          ...(activityLabel ? { last_activity: activityLabel } : {}),
        })
        .catch(() => {
          // Non-critical background heartbeat; ignore transient errors
        })
    },
    [currentMemberId]
  )

  const persistLastSeenRef = useRef(persistLastSeen)
  useEffect(() => {
    persistLastSeenRef.current = persistLastSeen
  }, [persistLastSeen])

  // Listen for page visibility, focus, and network recovery events
  useEffect(() => {
    const syncWakePresence = () => {
      if (!channelRef.current || !userIdRef.current) return
      void channelRef.current.ensureConnectedAndTrack({
        userId: userIdRef.current,
        activity: activityRef.current,
        onlineAt: onlineAtRef.current,
        updatedAt: new Date().toISOString(),
        isBackground: isHiddenRef.current,
      })
    }

    const handleVisibilityChange = () => {
      const hidden = document.visibilityState === "hidden"
      setIsHidden(hidden)
      isHiddenRef.current = hidden

      if (hidden) {
        persistLastSeenRef.current(true, activityRef.current)
      } else {
        syncWakePresence()
        persistLastSeenRef.current(false, activityRef.current)
      }
    }

    const handlePageHide = () => {
      persistLastSeenRef.current(true, activityRef.current)
    }

    const handleOnlineOrFocus = () => {
      if (document.visibilityState === "visible") {
        syncWakePresence()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("online", handleOnlineOrFocus)
    window.addEventListener("focus", handleOnlineOrFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("online", handleOnlineOrFocus)
      window.removeEventListener("focus", handleOnlineOrFocus)
    }
  }, [])

  // Subscribe to relationship presence channel (only recreated when auth/relationship changes)
  useEffect(() => {
    if (!isAuthenticated || !userId || !relationshipId) {
      resetPresence()
      return
    }

    onlineAtRef.current = new Date().toISOString()

    const channelHandler = presenceService.createPresenceChannel(
      relationshipId,
      userId,
      {
        onPartnerPresenceChange: (state) => {
          setPartnerPresence(state)
        },
        onPartnerLeave: () => {
          setLastDisconnectedAt(new Date().toISOString())
        },
      }
    )

    channelRef.current = channelHandler
    persistLastSeenRef.current(true, activityRef.current)

    // Periodic heartbeat for persisted last_seen_at while user remains active
    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        persistLastSeenRef.current(false, activityRef.current)
      }
    }, LAST_SEEN_THROTTLE_MS)

    return () => {
      window.clearInterval(heartbeatId)
      channelHandler.unsubscribe()
      channelRef.current = null
      resetPresence()
    }
  }, [
    isAuthenticated,
    userId,
    relationshipId,
    setPartnerPresence,
    setLastDisconnectedAt,
    resetPresence,
  ])

  // Persist initial last_seen once currentMemberId finishes loading
  useEffect(() => {
    if (currentMemberId) {
      persistLastSeen(true, activityRef.current)
    }
  }, [currentMemberId, persistLastSeen])

  // Broadcast updated activity whenever route, drawer override, visibility, or channel changes
  useEffect(() => {
    if (!isAuthenticated || !relationshipId || !channelRef.current || !userId) {
      return
    }

    void channelRef.current.track({
      userId,
      activity,
      onlineAt: onlineAtRef.current,
      updatedAt: new Date().toISOString(),
      isBackground: isHidden,
    })

    if (!isHidden) {
      persistLastSeenRef.current(false, activity)
    }
  }, [isAuthenticated, relationshipId, activity, isHidden, userId])
}

export function usePartnerPresence() {
  const { partnerMember, partnerName, partnerAlias } = useRelationship()
  const partnerPresence = usePresenceStore((s) => s.partnerPresence)
  const lastDisconnectedAt = usePresenceStore((s) => s.lastDisconnectedAt)

  const isOnline = Boolean(partnerPresence?.isOnline)
  const isBackground = Boolean(
    partnerPresence?.isOnline && partnerPresence?.isBackground
  )

  const currentActivity = isOnline
    ? partnerPresence?.activity || "Active in Fiora"
    : partnerMember?.content?.last_activity || null

  const lastSeenAt = useMemo(() => {
    if (isOnline) {
      return partnerPresence?.updatedAt || new Date().toISOString()
    }

    const candidates = [
      lastDisconnectedAt,
      partnerMember?.content?.last_seen_at ?? null,
    ].filter((ts): ts is string => Boolean(ts))

    if (candidates.length === 0) return null

    return candidates.reduce((latest, curr) =>
      new Date(curr).getTime() > new Date(latest).getTime() ? curr : latest
    )
  }, [
    isOnline,
    partnerPresence?.updatedAt,
    lastDisconnectedAt,
    partnerMember?.content?.last_seen_at,
  ])

  return {
    isOnline,
    isBackground,
    currentActivity,
    lastSeenAt,
    partnerMember,
    partnerName,
    partnerAlias,
  }
}

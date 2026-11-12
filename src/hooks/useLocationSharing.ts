import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { calculateDistanceMeters, formatDistanceBetween } from "@/lib/location"
import { locationService } from "@/services/locationService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type { MemberLocation } from "@/types/relationship"

// Preserve live locations across route navigation (e.g. /home -> /location)
const sessionLocationCache = new Map<string, MemberLocation>()

function getSessionLocation(relationshipId?: number, targetUserId?: string): MemberLocation | null {
  if (!relationshipId || !targetUserId) return null
  return sessionLocationCache.get(`${relationshipId}:${targetUserId}`) ?? null
}

function setSessionLocation(relationshipId: number | undefined, loc: MemberLocation) {
  if (!relationshipId || !loc.userId) return
  sessionLocationCache.set(`${relationshipId}:${loc.userId}`, loc)
}

export function useLocationSharing() {
  const { user } = useAuth()
  const { relationship, locationSharing, partnerMember, updateMemberLocation } = useRelationship()

  // Hydrate initial states from relationship.content.locations if present
  const savedLocations = relationship?.content?.locations
  const mySavedLocation = user?.id ? savedLocations?.[user.id] ?? null : null
  const partnerSavedLocation = partnerMember?.user_id
    ? savedLocations?.[partnerMember.user_id] ?? null
    : null

  const [liveMyLocation, setLiveMyLocation] = useState<MemberLocation | null>(() =>
    getSessionLocation(relationship?.id, user?.id)
  )
  const [livePartnerLocation, setLivePartnerLocation] = useState<MemberLocation | null>(() =>
    getSessionLocation(relationship?.id, partnerMember?.user_id)
  )
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const myLocation = useMemo(() => {
    const cached = getSessionLocation(relationship?.id, user?.id)
    const candidates = [liveMyLocation, cached, mySavedLocation].filter(
      (loc): loc is MemberLocation => loc !== null
    )
    if (candidates.length === 0) return null
    return candidates.reduce((latest, curr) =>
      new Date(curr.updated_at).getTime() > new Date(latest.updated_at).getTime()
        ? curr
        : latest
    )
  }, [liveMyLocation, mySavedLocation, relationship?.id, user?.id])

  const partnerLocation = useMemo(() => {
    const cached = getSessionLocation(relationship?.id, partnerMember?.user_id)
    const candidates = [livePartnerLocation, cached, partnerSavedLocation].filter(
      (loc): loc is MemberLocation => loc !== null
    )
    if (candidates.length === 0) return null
    return candidates.reduce((latest, curr) =>
      new Date(curr.updated_at).getTime() > new Date(latest.updated_at).getTime()
        ? curr
        : latest
    )
  }, [livePartnerLocation, partnerSavedLocation, relationship?.id, partnerMember?.user_id])

  const channelRef = useRef<ReturnType<typeof locationService.createLocationChannel> | null>(null)
  const lastPersistedLocRef = useRef<MemberLocation | null>(mySavedLocation)
  const myLocationRef = useRef<MemberLocation | null>(null)
  myLocationRef.current = myLocation

  // Smart persistence: ONLY on app open (first fix), manual refresh, or significant movement (>= 200m)
  const persistLocationSmartly = useCallback(
    async (coords: { lat: number; lng: number }, force = false) => {
      if (!user?.id || !relationship?.id) return

      const lastLoc = lastPersistedLocRef.current

      let distance = 999999
      if (lastLoc) {
        distance = calculateDistanceMeters(
          { lat: lastLoc.lat, lng: lastLoc.lng },
          coords
        )
      }

      // Persist conditions:
      // 1. Force (e.g. manual refresh)
      // 2. First time (no last location)
      // 3. Significant movement >= 200 meters (reduced frequency, no timeout periodic refreshes)
      const shouldPersist = force || !lastLoc || distance >= 200

      if (shouldPersist) {
        const placeName = await locationService.getPlaceName(coords.lat, coords.lng)
        const updatedPayload: MemberLocation = {
          userId: user.id,
          lat: coords.lat,
          lng: coords.lng,
          updated_at: new Date().toISOString(),
          placeName,
        }
        lastPersistedLocRef.current = updatedPayload
        setSessionLocation(relationship.id, updatedPayload)
        setLiveMyLocation(updatedPayload)

        try {
          await updateMemberLocation(updatedPayload)
        } catch (err) {
          console.error("Failed to update relationship location content:", err)
        }
      }
    },
    [user?.id, relationship?.id, updateMemberLocation]
  )

  const broadcastCurrentCoords = useCallback(
    async (
      coords: { lat: number; lng: number },
      options: { force?: boolean; skipPersist?: boolean } = {}
    ) => {
      const { force = false, skipPersist = false } = options
      if (!user?.id || !channelRef.current) return

      // Ignore micro-fluctuations under 200m unless forced or replying to a request
      const lastLoc = lastPersistedLocRef.current
      if (!force && !skipPersist && lastLoc) {
        const dist = calculateDistanceMeters(
          { lat: lastLoc.lat, lng: lastLoc.lng },
          coords
        )
        if (dist < 200) {
          return
        }
      }

      try {
        const placeName = lastPersistedLocRef.current?.placeName
        const payload = await channelRef.current.sendLocation({
          ...coords,
          placeName,
        })
        setSessionLocation(relationship?.id, payload)
        setLiveMyLocation(payload)
        if (!skipPersist) {
          void persistLocationSmartly(coords, force)
        }
      } catch (err) {
        console.error("Failed to broadcast location:", err)
      }
    },
    [user?.id, relationship?.id, persistLocationSmartly]
  )

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false)
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        broadcastCurrentCoords(coords, { force: true })
      },
      (err) => {
        setIsLocating(false)
        setGeoError(err.message || "Failed to fetch current location.")
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    )
  }, [broadcastCurrentCoords])

  // Setup broadcast channel & watcher when locationSharing is active
  useEffect(() => {
    if (!locationSharing || !relationship?.id || !user?.id) {
      return
    }

    const channelHandler = locationService.createLocationChannel(
      relationship.id,
      user.id,
      {
        onPartnerLocation: (loc) => {
          setSessionLocation(relationship.id, loc)
          setLivePartnerLocation(loc)
        },
        onLocationRequested: () => {
          if (myLocationRef.current) {
            void broadcastCurrentCoords(
              {
                lat: myLocationRef.current.lat,
                lng: myLocationRef.current.lng,
              },
              { skipPersist: true }
            )
          } else {
            refreshLocation()
          }
        },
      }
    )

    channelRef.current = channelHandler

    // Watch current user position with relaxed accuracy (no battery drain, no jitter)
    let watchId: number | null = null
    if (navigator.geolocation) {
      setIsLocating(true)
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setIsLocating(false)
          setGeoError(null)
          broadcastCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        },
        (err) => {
          setIsLocating(false)
          setGeoError(err.message || "Unable to retrieve GPS location.")
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        }
      )
    } else {
      setGeoError("Geolocation is not supported by your browser.")
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      channelHandler.unsubscribe()
      channelRef.current = null
    }
  }, [locationSharing, relationship?.id, user?.id, broadcastCurrentCoords, refreshLocation])

  const distanceMeters = useMemo(() => {
    if (!myLocation || !partnerLocation) return null
    return calculateDistanceMeters(myLocation, partnerLocation)
  }, [myLocation, partnerLocation])

  const formattedDistance = useMemo(() => {
    if (distanceMeters === null) return null
    return formatDistanceBetween(distanceMeters)
  }, [distanceMeters])

  return {
    locationSharing,
    myLocation,
    partnerLocation,
    partnerMember,
    distanceMeters,
    formattedDistance,
    isLocating,
    geoError,
    refreshLocation,
  }
}



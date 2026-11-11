import { useCallback, useEffect, useRef, useState } from "react"
import { locationService } from "@/services/locationService"
import { useAuth } from "./useAuth"
import { useRelationship } from "./useRelationship"
import type { MemberLocation } from "@/types/relationship"

export function useLocationSharing() {
  const { user } = useAuth()
  const { relationship, locationSharing, partnerMember } = useRelationship()

  const [myLocation, setMyLocation] = useState<MemberLocation | null>(null)
  const [partnerLocation, setPartnerLocation] = useState<MemberLocation | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const channelRef = useRef<ReturnType<typeof locationService.createLocationChannel> | null>(null)
  const myLocationRef = useRef<MemberLocation | null>(null)
  myLocationRef.current = myLocation

  const broadcastCurrentCoords = useCallback(
    async (coords: { lat: number; lng: number }) => {
      if (!user?.id || !channelRef.current) return
      try {
        const payload = await channelRef.current.sendLocation(coords)
        setMyLocation(payload)
      } catch (err) {
        console.error("Failed to broadcast location:", err)
      }
    },
    [user?.id]
  )

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        broadcastCurrentCoords(coords)
      },
      (err) => {
        setIsLocating(false)
        setGeoError(err.message || "Failed to fetch current location.")
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
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
          setPartnerLocation(loc)
        },
        onLocationRequested: () => {
          if (myLocationRef.current) {
            broadcastCurrentCoords({
              lat: myLocationRef.current.lat,
              lng: myLocationRef.current.lng,
            })
          } else {
            refreshLocation()
          }
        },
      }
    )

    channelRef.current = channelHandler

    // Immediately request partner's location once subscribed
    setTimeout(() => {
      channelHandler.requestPartnerLocation()
    }, 500)

    // Watch current user position
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
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
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

  return {
    locationSharing,
    myLocation,
    partnerLocation,
    partnerMember,
    isLocating,
    geoError,
    refreshLocation,
  }
}


import { supabase } from "./supabase"
import type { MemberLocation } from "../types/relationship"

export interface LocationChannelCallbacks {
  onPartnerLocation: (location: MemberLocation) => void
  onLocationRequested?: () => void
}

const placeNameCache = new Map<string, string>()

export const locationService = {
  async getPlaceName(lat: number, lng: number): Promise<string> {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
    if (placeNameCache.has(key)) {
      return placeNameCache.get(key)!
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      )
      if (!res.ok) {
        throw new Error("Geocoding failed")
      }
      const data = await res.json()
      const addr = data.address || {}
      const name =
        addr.suburb ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.city ||
        addr.town ||
        addr.county ||
        addr.state ||
        data.name ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`

      placeNameCache.set(key, name)
      return name
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  },

  createLocationChannel(
    relationshipId: number,
    userId: string,
    callbacks: LocationChannelCallbacks
  ) {
    const channelName = `location-sharing-${relationshipId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false,
        },
      },
    })

    const sendLocation = async (coords: { lat: number; lng: number; placeName?: string }) => {
      const payload: MemberLocation = {
        userId,
        lat: coords.lat,
        lng: coords.lng,
        updated_at: new Date().toISOString(),
        placeName: coords.placeName,
      }
      await channel.send({
        type: "broadcast",
        event: "location_update",
        payload,
      })
      return payload
    }

    const requestPartnerLocation = async () => {
      await channel.send({
        type: "broadcast",
        event: "location_request",
        payload: { requesterId: userId },
      })
    }

    channel
      .on(
        "broadcast",
        { event: "location_update" },
        (response: { payload: MemberLocation }) => {
          if (response.payload && response.payload.userId !== userId) {
            callbacks.onPartnerLocation(response.payload)
          }
        }
      )
      .on(
        "broadcast",
        { event: "location_request" },
        (response: { payload: { requesterId: string } }) => {
          if (response.payload && response.payload.requesterId !== userId) {
            callbacks.onLocationRequested?.()
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void requestPartnerLocation()
        }
      })

    const unsubscribe = () => {
      supabase.removeChannel(channel)
    }

    return {
      channel,
      sendLocation,
      requestPartnerLocation,
      unsubscribe,
    }
  },
}


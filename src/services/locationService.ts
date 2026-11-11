import { supabase } from "./supabase"
import type { MemberLocation } from "../types/relationship"

export interface LocationChannelCallbacks {
  onPartnerLocation: (location: MemberLocation) => void
  onLocationRequested?: () => void
}

export const locationService = {
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
      .subscribe()

    const sendLocation = async (coords: { lat: number; lng: number }) => {
      const payload: MemberLocation = {
        userId,
        lat: coords.lat,
        lng: coords.lng,
        updated_at: new Date().toISOString(),
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


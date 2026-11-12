import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { PartnerPresenceState, PresencePayload } from "../types/presence"

export interface PresenceChannelCallbacks {
  onPartnerPresenceChange: (state: PartnerPresenceState) => void
  onPartnerLeave?: () => void
}

const OFFLINE_GRACE_PERIOD_MS = 4_000
const BASE_RECONNECT_DELAY_MS = 1_500
const MAX_RECONNECT_DELAY_MS = 15_000

function extractPartnerPresence(
  presenceState: Record<string, PresencePayload[]>,
  currentUserId: string
): PartnerPresenceState | null {
  const partnerEntries: PresencePayload[] = []

  for (const [key, metas] of Object.entries(presenceState)) {
    if (key === currentUserId) continue
    for (const meta of metas) {
      if (meta && meta.userId !== currentUserId) {
        partnerEntries.push(meta)
      }
    }
  }

  if (partnerEntries.length === 0) {
    return null
  }

  // Prefer foreground presence; otherwise pick the most recently updated entry
  const sorted = [...partnerEntries].sort((a, b) => {
    if (a.isBackground !== b.isBackground) {
      return a.isBackground ? 1 : -1
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const latest = sorted[0]
  return {
    isOnline: true,
    activity: latest.activity,
    onlineAt: latest.onlineAt,
    updatedAt: latest.updatedAt,
    isBackground: Boolean(latest.isBackground),
  }
}

export const presenceService = {
  createPresenceChannel(
    relationshipId: number,
    userId: string,
    callbacks: PresenceChannelCallbacks
  ) {
    const channelName = `presence-relationship-${relationshipId}`
    const fullTopic = `realtime:${channelName}`

    let channel: RealtimeChannel | null = null
    let isSubscribed = false
    let isDisposed = false
    let pendingPayload: PresencePayload | null = null
    let wasPartnerOnline = false
    let offlineTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectAttempt = 0

    const clearOfflineTimer = () => {
      if (offlineTimer !== null) {
        clearTimeout(offlineTimer)
        offlineTimer = null
      }
    }

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const removeStaleChannels = () => {
      const existing = supabase
        .getChannels()
        .filter((ch) => ch.topic === fullTopic)
      for (const ch of existing) {
        void supabase.removeChannel(ch)
      }
    }

    const syncPartnerState = (activeChannel: RealtimeChannel) => {
      if (isDisposed || activeChannel !== channel) return

      const state = activeChannel.presenceState<PresencePayload>()
      const partner = extractPartnerPresence(state, userId)

      if (partner) {
        clearOfflineTimer()
        wasPartnerOnline = true
        callbacks.onPartnerPresenceChange(partner)
        return
      }

      // Debounce offline transition so brief phx_ref rotations or 1-3s reconnects don't flicker
      if (offlineTimer === null) {
        offlineTimer = setTimeout(() => {
          offlineTimer = null
          if (isDisposed) return

          if (wasPartnerOnline) {
            wasPartnerOnline = false
            callbacks.onPartnerLeave?.()
          }
          callbacks.onPartnerPresenceChange({
            isOnline: false,
            activity: null,
            onlineAt: null,
            updatedAt: null,
            isBackground: false,
          })
        }, OFFLINE_GRACE_PERIOD_MS)
      }
    }

    const scheduleReconnect = () => {
      if (isDisposed || reconnectTimer !== null) return
      const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
        MAX_RECONNECT_DELAY_MS
      )
      reconnectAttempt += 1

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        if (!isDisposed) {
          connectChannel()
        }
      }, delay)
    }

    const connectChannel = () => {
      if (isDisposed) return
      clearReconnectTimer()

      if (channel) {
        const oldChannel = channel
        channel = null
        isSubscribed = false
        void supabase.removeChannel(oldChannel)
      }

      removeStaleChannels()

      const nextChannel = supabase.channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      })
      channel = nextChannel

      nextChannel
        .on("presence", { event: "sync" }, () => {
          syncPartnerState(nextChannel)
        })
        .on("presence", { event: "join" }, () => {
          syncPartnerState(nextChannel)
        })
        .on("presence", { event: "leave" }, () => {
          syncPartnerState(nextChannel)
        })
        .subscribe((status) => {
          if (isDisposed || nextChannel !== channel) return

          if (status === "SUBSCRIBED") {
            isSubscribed = true
            reconnectAttempt = 0
            if (pendingPayload) {
              void nextChannel.track(pendingPayload)
            }
          } else if (
            status === "TIMED_OUT" ||
            status === "CHANNEL_ERROR" ||
            status === "CLOSED"
          ) {
            isSubscribed = false
            scheduleReconnect()
          }
        })
    }

    connectChannel()

    const track = async (payload: PresencePayload) => {
      pendingPayload = payload
      if (!isSubscribed || !channel) return
      await channel.track(payload)
    }

    const ensureConnectedAndTrack = async (payload: PresencePayload) => {
      pendingPayload = payload
      if (isDisposed) return

      if (isSubscribed && channel) {
        await channel.track(payload)
        return
      }

      reconnectAttempt = 0
      connectChannel()
    }

    const unsubscribe = () => {
      isDisposed = true
      isSubscribed = false
      clearOfflineTimer()
      clearReconnectTimer()

      if (channel) {
        const current = channel
        channel = null
        void supabase.removeChannel(current)
      }
    }

    return {
      track,
      ensureConnectedAndTrack,
      unsubscribe,
    }
  },

  async updateMemberLastSeen(
    memberId: number,
    patch: { last_seen_at: string; last_activity?: string }
  ): Promise<void> {
    const { data: currentData, error: fetchError } = await supabase
      .from("relationship_members")
      .select("content")
      .eq("id", memberId)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    const mergedContent = {
      ...(currentData?.content || {}),
      ...patch,
    }

    const { error: updateError } = await supabase
      .from("relationship_members")
      .update({
        content: mergedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId)

    if (updateError) {
      throw new Error(updateError.message)
    }
  },
}

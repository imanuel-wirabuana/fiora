import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export interface TypingBroadcastPayload {
  userId: string
  isTyping: boolean
}

export interface TypingChannelHandle {
  sendTyping: (isTyping: boolean) => void
  unsubscribe: () => void
}

const TYPING_TIMEOUT_MS = 4_000

/**
 * Creates a Supabase Realtime Broadcast channel keyed by the relationship ID
 * (`chat-room-${relationshipId}`) for ephemeral typing indicators.
 */
export const chatService = {
  createTypingChannel(
    relationshipId: number,
    currentUserId: string,
    onPartnerTypingChange: (isTyping: boolean) => void
  ): TypingChannelHandle {
    const channelName = `chat-room-${relationshipId}`
    let isSubscribed = false
    let isDisposed = false
    let clearTimer: ReturnType<typeof setTimeout> | null = null

    const clearSafetyTimer = () => {
      if (clearTimer !== null) {
        clearTimeout(clearTimer)
        clearTimer = null
      }
    }

    const channel: RealtimeChannel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: TypingBroadcastPayload }) => {
          if (isDisposed || !payload || payload.userId === currentUserId) return

          clearSafetyTimer()

          if (payload.isTyping) {
            onPartnerTypingChange(true)
            clearTimer = setTimeout(() => {
              clearTimer = null
              if (!isDisposed) {
                onPartnerTypingChange(false)
              }
            }, TYPING_TIMEOUT_MS)
          } else {
            onPartnerTypingChange(false)
          }
        }
      )
      .subscribe((status) => {
        if (isDisposed) return
        isSubscribed = status === "SUBSCRIBED"
      })

    return {
      sendTyping(isTyping: boolean) {
        if (isDisposed || !isSubscribed) return
        void channel.send({
          type: "broadcast",
          event: "typing",
          payload: {
            userId: currentUserId,
            isTyping,
          } satisfies TypingBroadcastPayload,
        })
      },
      unsubscribe() {
        isDisposed = true
        isSubscribed = false
        clearSafetyTimer()
        onPartnerTypingChange(false)
        void supabase.removeChannel(channel)
      },
    }
  },
}

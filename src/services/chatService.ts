import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export interface TypingBroadcastPayload {
  userId: string
  isTyping: boolean
}

export interface ReadBroadcastPayload {
  userId: string
  readAt: string
}

export interface ChatRoomChannelCallbacks {
  onPartnerTypingChange: (isTyping: boolean) => void
  onPartnerRead: (readAt: string) => void
}

export interface ChatRoomChannelHandle {
  sendTyping: (isTyping: boolean) => void
  sendReadReceipt: (readAt: string) => void
  unsubscribe: () => void
}

const TYPING_TIMEOUT_MS = 4_000

/**
 * Creates a Supabase Realtime Broadcast channel keyed by the relationship ID
 * (`chat-room-${relationshipId}`) for ephemeral typing and read-receipt events.
 */
export const chatService = {
  createChatRoomChannel(
    relationshipId: number,
    currentUserId: string,
    callbacks: ChatRoomChannelCallbacks
  ): ChatRoomChannelHandle {
    const channelName = `chat-room-${relationshipId}`
    let isSubscribed = false
    let isDisposed = false
    let pendingReadAt: string | null = null
    let clearTimer: ReturnType<typeof setTimeout> | null = null

    const clearSafetyTimer = () => {
      if (clearTimer !== null) {
        clearTimeout(clearTimer)
        clearTimer = null
      }
    }

    const emitReadReceipt = (activeChannel: RealtimeChannel, readAt: string) => {
      void activeChannel.send({
        type: "broadcast",
        event: "read",
        payload: {
          userId: currentUserId,
          readAt,
        } satisfies ReadBroadcastPayload,
      })
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
            callbacks.onPartnerTypingChange(true)
            clearTimer = setTimeout(() => {
              clearTimer = null
              if (!isDisposed) {
                callbacks.onPartnerTypingChange(false)
              }
            }, TYPING_TIMEOUT_MS)
          } else {
            callbacks.onPartnerTypingChange(false)
          }
        }
      )
      .on(
        "broadcast",
        { event: "read" },
        ({ payload }: { payload: ReadBroadcastPayload }) => {
          if (isDisposed || !payload || payload.userId === currentUserId) return
          if (payload.readAt) {
            callbacks.onPartnerRead(payload.readAt)
          }
        }
      )
      .subscribe((status) => {
        if (isDisposed) return
        isSubscribed = status === "SUBSCRIBED"
        if (isSubscribed && pendingReadAt) {
          const readAtToSend = pendingReadAt
          pendingReadAt = null
          emitReadReceipt(channel, readAtToSend)
        }
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
      sendReadReceipt(readAt: string) {
        if (isDisposed) return
        if (!isSubscribed) {
          pendingReadAt = readAt
          return
        }
        emitReadReceipt(channel, readAt)
      },
      unsubscribe() {
        isDisposed = true
        isSubscribed = false
        pendingReadAt = null
        clearSafetyTimer()
        callbacks.onPartnerTypingChange(false)
        void supabase.removeChannel(channel)
      },
    }
  },
}

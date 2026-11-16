import { useState } from "react"
import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
  ChatZodiacWatermark,
} from "@/components/chat"
import { ChatScreenSkeleton } from "@/components/ScreenSkeletons"
import { useAuth } from "@/hooks/useAuth"
import { useChatMessages, useChatRoom } from "@/hooks/useChat"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"
import { useRelationship } from "@/hooks/useRelationship"
import type { ChatReplyRef } from "@/types/activity"

export function ChatScreen() {
  const { user } = useAuth()
  const { currentMember } = useRelationship()
  const { partnerMember, partnerName } = usePartnerPresence()
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    sendMessage,
    isSending,
    toggleReaction,
    unsendMessage,
  } = useChatMessages()
  const {
    isPartnerTyping,
    partnerReadAt,
    handleTypingInput,
    stopTyping,
  } = useChatRoom(messages)
  const [replyingTo, setReplyingTo] = useState<ChatReplyRef | null>(null)

  if (isLoading) {
    return <ChatScreenSkeleton />
  }

  const currentUserName = currentMember?.content?.name || "You"

  return (
    <section className="mx-auto flex h-[calc(100svh-7.75rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col sm:max-w-2xl md:h-auto md:min-h-0 md:flex-1 md:pb-19">
      <ChatHeader isPartnerTyping={isPartnerTyping} />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[oklch(from_var(--primary)_0.94_calc(c*0.35)_h)] dark:bg-[oklch(from_var(--primary)_0.22_calc(c*0.35)_h)]">
        <ChatZodiacWatermark />

        <ChatMessageList
          messages={messages}
          currentUserId={user?.id}
          currentUserName={currentUserName}
          partnerName={partnerName}
          partnerAvatar={partnerMember?.content?.avatar}
          partnerReadAt={partnerReadAt}
          isPartnerTyping={isPartnerTyping}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => {
            void fetchNextPage()
          }}
          onReply={setReplyingTo}
          onReact={(activity, emoji) => {
            toggleReaction({ activity, emoji })
          }}
          onUnsend={(activityId) => {
            unsendMessage(activityId)
          }}
        />

        <ChatComposer
          disabled={!partnerMember}
          isSending={isSending}
          partnerName={partnerName}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSend={sendMessage}
          onTypingChange={handleTypingInput}
          onStopTyping={stopTyping}
        />
      </div>
    </section>
  )
}

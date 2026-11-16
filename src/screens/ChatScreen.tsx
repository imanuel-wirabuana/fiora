import { useState } from "react"
import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
} from "@/components/chat"
import { ChatScreenSkeleton } from "@/components/ScreenSkeletons"
import { useAuth } from "@/hooks/useAuth"
import {
  useChatMessages,
  useChatReadReceipt,
  useChatTyping,
} from "@/hooks/useChat"
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
  const { isPartnerTyping, handleTypingInput, stopTyping } = useChatTyping()
  const [replyingTo, setReplyingTo] = useState<ChatReplyRef | null>(null)

  useChatReadReceipt(messages)

  if (isLoading) {
    return <ChatScreenSkeleton />
  }

  const currentUserName = currentMember?.content?.name || "You"

  return (
    <section className="mx-auto flex h-[calc(100svh-7.75rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col sm:max-w-2xl md:h-auto md:min-h-0 md:flex-1 md:pb-19">
      <ChatHeader isPartnerTyping={isPartnerTyping} />

      <ChatMessageList
        messages={messages}
        currentUserId={user?.id}
        currentUserName={currentUserName}
        partnerName={partnerName}
        partnerAvatar={partnerMember?.content?.avatar}
        partnerReadAt={partnerMember?.content?.chat_read_at}
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
    </section>
  )
}

import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
} from "@/components/chat"
import { ChatScreenSkeleton } from "@/components/ScreenSkeletons"
import { useAuth } from "@/hooks/useAuth"
import { useChatMessages, useChatTyping } from "@/hooks/useChat"
import { usePartnerPresence } from "@/hooks/usePartnerPresence"

export function ChatScreen() {
  const { user } = useAuth()
  const { partnerMember, partnerName } = usePartnerPresence()
  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    sendMessage,
    isSending,
  } = useChatMessages()
  const { isPartnerTyping, handleTypingInput, stopTyping } = useChatTyping()

  if (isLoading) {
    return <ChatScreenSkeleton />
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-7.75rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col sm:max-w-2xl md:h-auto md:min-h-0 md:flex-1 md:pb-19">
      <ChatHeader isPartnerTyping={isPartnerTyping} />

      <ChatMessageList
        messages={messages}
        currentUserId={user?.id}
        partnerName={partnerName}
        partnerAvatar={partnerMember?.content?.avatar}
        isPartnerTyping={isPartnerTyping}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => {
          void fetchNextPage()
        }}
      />

      <ChatComposer
        disabled={!partnerMember}
        isSending={isSending}
        partnerName={partnerName}
        onSend={sendMessage}
        onTypingChange={handleTypingInput}
        onStopTyping={stopTyping}
      />
    </section>
  )
}

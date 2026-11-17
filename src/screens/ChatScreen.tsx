import { useMemo, useState } from "react"
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
import { parseZodiacFromBirthDate } from "@/lib/relationship"
import type {
  Activity,
  ChatActivityContent,
  ChatReplyRef,
} from "@/types/activity"

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
    editMessage,
    isEditing,
    toggleReaction,
    deleteMessages,
    unsendMessages,
  } = useChatMessages()
  const { isPartnerTyping, partnerReadAt, handleTypingInput, stopTyping } =
    useChatRoom(messages)

  const [replyingTo, setReplyingTo] = useState<ChatReplyRef | null>(null)
  const [editingMessage, setEditingMessage] =
    useState<Activity<ChatActivityContent> | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchIndex, setActiveSearchIndex] = useState(0)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchMatchIds = useMemo(() => {
    if (!normalizedQuery) return []
    return messages
      .filter((msg) =>
        (msg.content?.text ?? "").toLowerCase().includes(normalizedQuery)
      )
      .map((msg) => msg.id)
  }, [messages, normalizedQuery])

  if (isLoading) {
    return <ChatScreenSkeleton />
  }

  const currentUserName = currentMember?.content?.name || "You"
  const myZodiac = parseZodiacFromBirthDate(currentMember?.content?.birth_date)
  const partnerZodiac = parseZodiacFromBirthDate(
    partnerMember?.content?.birth_date
  )

  const safeSearchIndex =
    searchMatchIds.length > 0
      ? Math.min(activeSearchIndex, searchMatchIds.length - 1)
      : 0
  const activeSearchMatchId =
    searchMatchIds.length > 0 ? searchMatchIds[safeSearchIndex] : null

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value)
    const nextNormalized = value.trim().toLowerCase()
    if (!nextNormalized) {
      setActiveSearchIndex(0)
      return
    }
    const nextMatchCount = messages.filter((msg) =>
      (msg.content?.text ?? "").toLowerCase().includes(nextNormalized)
    ).length
    setActiveSearchIndex(Math.max(0, nextMatchCount - 1))
  }

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => {
      if (prev) {
        setSearchQuery("")
        setActiveSearchIndex(0)
      }
      return !prev
    })
  }

  const handlePrevSearchMatch = () => {
    if (searchMatchIds.length === 0) return
    setActiveSearchIndex((prev) =>
      prev <= 0 ? searchMatchIds.length - 1 : prev - 1
    )
  }

  const handleNextSearchMatch = () => {
    if (searchMatchIds.length === 0) return
    setActiveSearchIndex((prev) =>
      prev >= searchMatchIds.length - 1 ? 0 : prev + 1
    )
  }

  const selectedMessages = messages.filter((msg) => selectedIds.has(msg.id))
  const canEditSelected =
    selectedMessages.length === 1 && selectedMessages[0].user_id === user?.id
  const canUnsendSelected =
    selectedMessages.length > 0 &&
    selectedMessages.every((msg) => msg.user_id === user?.id)

  const handleSelectMessage = (activityId: number) => {
    setIsSelectionMode(true)
    setSelectedIds(new Set([activityId]))
  }

  const handleToggleSelectMessage = (activityId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(activityId)) {
        next.delete(activityId)
      } else {
        next.add(activityId)
      }
      return next
    })
  }

  const handleClearSelection = () => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleReplySelected = () => {
    const target = selectedMessages[0]
    if (!target) return
    const isMine = target.user_id === user?.id
    setEditingMessage(null)
    setReplyingTo({
      id: target.id,
      userId: target.user_id,
      senderName: isMine ? currentUserName : partnerName,
      text: target.content?.text ?? "",
    })
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleEditSelected = () => {
    const target = selectedMessages[0]
    if (!target || target.user_id !== user?.id) return
    setReplyingTo(null)
    setEditingMessage(target)
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedMessages.length === 0) return
    deleteMessages(selectedMessages)
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleUnsendSelected = () => {
    if (!canUnsendSelected) return
    unsendMessages(selectedMessages.map((msg) => msg.id))
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-3rem)] w-full max-w-md flex-col sm:max-w-2xl md:h-auto md:min-h-0 md:flex-1 md:pb-0">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[oklch(from_var(--primary)_0.94_calc(c*0.35)_h)] dark:bg-[oklch(from_var(--primary)_0.22_calc(c*0.35)_h)]">
        <ChatZodiacWatermark
          myZodiac={myZodiac}
          partnerZodiac={partnerZodiac}
        />

        <ChatHeader
          isPartnerTyping={isPartnerTyping}
          isSearchOpen={isSearchOpen}
          searchQuery={searchQuery}
          searchMatchCount={searchMatchIds.length}
          activeSearchIndex={safeSearchIndex}
          onToggleSearch={handleToggleSearch}
          onSearchQueryChange={handleSearchQueryChange}
          onPrevSearchMatch={handlePrevSearchMatch}
          onNextSearchMatch={handleNextSearchMatch}
          isSelectionMode={isSelectionMode}
          selectedCount={selectedMessages.length}
          canEditSelected={canEditSelected}
          canUnsendSelected={canUnsendSelected}
          onClearSelection={handleClearSelection}
          onReplySelected={handleReplySelected}
          onEditSelected={handleEditSelected}
          onDeleteSelected={handleDeleteSelected}
          onUnsendSelected={handleUnsendSelected}
        />

        <ChatMessageList
          messages={messages}
          searchQuery={normalizedQuery}
          activeSearchMatchId={activeSearchMatchId}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          currentUserId={user?.id}
          partnerName={partnerName}
          partnerAvatar={partnerMember?.content?.avatar}
          partnerReadAt={partnerReadAt}
          isPartnerTyping={isPartnerTyping}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => {
            void fetchNextPage()
          }}
          onSelectMessage={handleSelectMessage}
          onToggleSelectMessage={handleToggleSelectMessage}
          onReact={(activity, emoji) => {
            void toggleReaction({ activity, emoji })
            setIsSelectionMode(false)
            setSelectedIds(new Set())
          }}
        />

        <ChatComposer
          key={editingMessage ? `edit-${editingMessage.id}` : "compose"}
          disabled={!partnerMember}
          isSending={isSending}
          isEditing={isEditing}
          partnerName={partnerName}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelReply={() => setReplyingTo(null)}
          onCancelEdit={() => setEditingMessage(null)}
          onSend={sendMessage}
          onEditSave={(activity, text) => editMessage({ activity, text })}
          onTypingChange={handleTypingInput}
          onStopTyping={stopTyping}
        />
      </div>
    </section>
  )
}

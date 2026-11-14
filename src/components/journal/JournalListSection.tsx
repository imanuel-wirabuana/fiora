import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { BookOpen, Globe, Lock, Trash2 } from "lucide-react"
import { useLocation } from "wouter"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { useAuth } from "@/hooks/useAuth"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useRelationship } from "@/hooks/useRelationship"
import type { Activity, JournalActivityContent } from "@/types/activity"
import type { PrivacyFilter } from "./JournalFilterSection"

interface JournalListSectionProps {
  journals: Activity[]
  isLoading: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  search: string
  privacyFilter: PrivacyFilter
  onTogglePrivacy: (id: number, content: JournalActivityContent) => void
  onDelete: (id: number) => void
}

export function JournalListSection({
  journals,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  search,
  privacyFilter,
  onTogglePrivacy,
  onDelete,
}: JournalListSectionProps) {
  const [, navigate] = useLocation()
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      fetchNextPage?.()
    },
  })
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    title: string
  } | null>(null)

  const getAuthorName = (authorId: string) => {
    if (authorId === user?.id) {
      return {
        name: "You",
        avatar: currentMember?.content?.avatar || "🙋",
        isMe: true,
      }
    }
    return {
      name: partnerMember?.content?.name || "Partner",
      avatar: partnerMember?.content?.avatar || "🤍",
      isMe: false,
    }
  }

  if (isLoading) {
    return (
      <div className="columns-3 gap-2 space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <CustomSkeleton
            key={idx}
            className="w-full break-inside-avoid"
            style={{ height: idx % 2 === 0 ? 112 : 144 }}
          />
        ))}
      </div>
    )
  }

  if (journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
        <BookOpen className="size-8 opacity-40" />
        <p className="text-xs">
          {search
            ? "No entries match your search."
            : privacyFilter !== "all"
              ? `No ${privacyFilter} journals found.`
              : "No journal entries yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="columns-3 gap-2 space-y-2">
      {journals.map((journal) => {
        const content = journal.content as JournalActivityContent | null
        const author = getAuthorName(journal.user_id)
        if (!content) return null

        const isShared = !!content.isShared
        const itemVariant = !author.isMe
          ? "soft"
          : isShared
            ? "outline"
            : "default"

        return (
          <CustomItem
            key={journal.id}
            variant={itemVariant}
            onClick={() => navigate(`/journal/${journal.id}`)}
            className="max-h-64 cursor-pointer break-inside-avoid gap-1.5 overflow-hidden p-2.5 transition-colors hover:bg-muted/30 [content-visibility:auto] [contain-intrinsic-size:auto_140px]"
            icon={<span className="text-xs leading-none">{author.avatar}</span>}
            title={content.title}
            topRightActions={
              author.isMe ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePrivacy(journal.id, content)
                  }}
                  title={isShared ? "Make private" : "Share with partner"}
                  className="rounded p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {isShared ? (
                    <Globe className="size-3 text-emerald-500" />
                  ) : (
                    <Lock className="size-3 text-amber-500" />
                  )}
                </button>
              ) : isShared ? (
                <Globe className="size-3 shrink-0 text-emerald-500" />
              ) : (
                <Lock className="size-3 shrink-0 text-amber-500" />
              )
            }
            description={content.body || undefined}
            descriptionClassName="line-clamp-8 whitespace-pre-wrap leading-snug"
            bottomLeftInfo={
              <span className="truncate text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(journal.created_at), {
                  addSuffix: true,
                })}
              </span>
            }
            bottomRightActions={
              author.isMe ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget({ id: journal.id, title: content.title })
                  }}
                  className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                  title="Delete journal"
                >
                  <Trash2 className="size-3" />
                </button>
              ) : null
            }
          />
        )
      })}

      <div ref={sentinelRef} className="h-1 w-full" />
      {isFetchingNextPage && (
        <div className="mt-2 columns-3 gap-2 space-y-2">
          <CustomSkeleton className="h-28 w-full break-inside-avoid" />
          <CustomSkeleton className="h-32 w-full break-inside-avoid" />
          <CustomSkeleton className="h-24 w-full break-inside-avoid" />
        </div>
      )}

      <FormDrawer
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete journal entry?"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.title}"?`
            : undefined
        }
        submitLabel="Delete"
        successLabel="Deleted!"
        onSubmit={() => {
          if (!deleteTarget) return false
          onDelete(deleteTarget.id)
          return true
        }}
      />
    </div>
  )
}


import { formatDistanceToNow } from "date-fns"
import { BookOpen, Globe, Lock, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import type { Activity, JournalActivityContent } from "@/types/activity"
import type { PrivacyFilter } from "./JournalFilterSection"

interface JournalListSectionProps {
  journals: Activity[]
  isLoading: boolean
  search: string
  privacyFilter: PrivacyFilter
  onTogglePrivacy: (id: number, content: JournalActivityContent) => void
  onDelete: (id: number) => void
}

export function JournalListSection({
  journals,
  isLoading,
  search,
  privacyFilter,
  onTogglePrivacy,
  onDelete,
}: JournalListSectionProps) {
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()

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
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-primary" />
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
    <div className="flex flex-col gap-3">
      {journals.map((journal) => {
        const content = journal.content as JournalActivityContent | null
        const author = getAuthorName(journal.user_id)
        if (!content) return null

        const isShared = !!content.isShared

        return (
          <Item
            key={journal.id}
            variant="outline"
            className="w-full flex-col items-start gap-2 p-3.5"
          >
            <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{author.avatar}</span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {author.name}
                </span>

                {/* Privacy Badge */}
                {isShared ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] py-0 px-1.5 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                  >
                    <Globe className="size-2.5" />
                    Shared
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] py-0 px-1.5 font-normal text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10"
                  >
                    <Lock className="size-2.5" />
                    Private
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(journal.created_at), {
                    addSuffix: true,
                  })}
                </span>

                {author.isMe && (
                  <div className="flex items-center gap-1">
                    {/* Toggle Privacy Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => onTogglePrivacy(journal.id, content)}
                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                      title={isShared ? "Make private" : "Share with partner"}
                    >
                      {isShared ? "Make Private" : "Share"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => onDelete(journal.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition"
                      title="Delete journal"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </ItemHeader>

            <ItemContent className="w-full space-y-1">
              <ItemTitle className="text-sm font-semibold text-foreground">
                {content.title}
              </ItemTitle>
              <ItemDescription className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content.body}
              </ItemDescription>
            </ItemContent>
          </Item>
        )
      })}
    </div>
  )
}


import { formatDistanceToNow } from "date-fns"
import { BookOpen, Globe, Lock, Trash2 } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        const itemVariant = !author.isMe
          ? "fill"
          : isShared
            ? "outline"
            : "default"
        const isFill = itemVariant === "fill"

        return (
          <CustomItem
            key={journal.id}
            variant={itemVariant}
            className="gap-2"
            icon={<span className="text-sm leading-none">{author.avatar}</span>}
            title={content.title}
            topRightActions={
              isShared ? (
                <Badge
                  variant="outline"
                  className={
                    isFill
                      ? "gap-1 border-primary-foreground/25 bg-primary-foreground/15 px-1.5 py-0 text-[10px] font-normal text-primary-foreground"
                      : "gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-normal text-emerald-600 dark:text-emerald-400"
                  }
                >
                  <Globe className="size-2.5" />
                  Shared
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-500/20 bg-amber-500/10 px-1.5 py-0 text-[10px] font-normal text-amber-600 dark:text-amber-400"
                >
                  <Lock className="size-2.5" />
                  Private
                </Badge>
              )
            }
            description={content.body}
            descriptionClassName="whitespace-pre-wrap leading-relaxed"
            bottomLeftInfo={
              <span
                className={
                  isFill
                    ? "truncate text-[11px] text-primary-foreground/80"
                    : "truncate text-[11px] text-muted-foreground"
                }
              >
                <span className="font-medium">{author.name}</span> ·{" "}
                {formatDistanceToNow(new Date(journal.created_at), {
                  addSuffix: true,
                })}
              </span>
            }
            bottomRightActions={
              author.isMe ? (
                <>
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
                    className="rounded p-1 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                    title="Delete journal"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </>
              ) : null
            }
          />
        )
      })}
    </div>
  )
}


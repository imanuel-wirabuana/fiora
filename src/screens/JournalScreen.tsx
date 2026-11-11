import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { BookOpen, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import type { JournalActivityContent } from "@/types/activity"

export function JournalScreen() {
  const {
    journalActivities,
    createJournal,
    deleteActivity,
    isLoading,
    createActivityMutation,
    deleteActivityMutation,
  } = useActivities()
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()

  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const isSaving = createActivityMutation.isPending
  const isDeleting = deleteActivityMutation.isPending

  const filteredJournals = journalActivities.filter((activity) => {
    const content = activity.content as JournalActivityContent | null
    if (!content) return false
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      content.title.toLowerCase().includes(q) ||
      content.body.toLowerCase().includes(q)
    )
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    await createJournal({
      title: title.trim(),
      body: body.trim(),
    })

    setTitle("")
    setBody("")
    setIsCreating(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      await deleteActivity(id)
    }
  }

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

  return (
    <section className="flex flex-col gap-4">
      {/* Top search & Add Action */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search journals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-xs rounded-xl"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-9 gap-1.5 px-3 rounded-xl text-xs"
        >
          <Plus className="size-3.5" />
          New Entry
        </Button>
      </div>

      {/* New Journal Form Modal/Card */}
      {isCreating && (
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground">
              Write a Journal Entry
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsCreating(false)}
              className="size-6 text-muted-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <Input
            type="text"
            placeholder="Title (e.g. Our trip to the beach)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            className="h-8 bg-background text-xs rounded-xl"
            autoFocus
          />

          <Textarea
            placeholder="Write your sweet memory or thoughts..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="bg-background text-xs rounded-xl resize-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="xs"
              disabled={isSaving || !title.trim() || !body.trim()}
              className="gap-1.5"
            >
              {isSaving ? <Spinner className="size-3" /> : "Save Entry"}
            </Button>
          </div>
        </form>
      )}

      {/* Journal entries */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
          <BookOpen className="size-8 opacity-40" />
          <p className="text-xs">
            {search ? "No entries match your search." : "No journal entries yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredJournals.map((journal) => {
            const content = journal.content as JournalActivityContent | null
            const author = getAuthorName(journal.user_id)
            if (!content) return null

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
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(journal.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {author.isMe && (
                      <button
                        type="button"
                        onClick={() => handleDelete(journal.id)}
                        disabled={isDeleting}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition"
                        title="Delete journal"
                      >
                        <Trash2 className="size-3" />
                      </button>
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
      )}
    </section>
  )
}

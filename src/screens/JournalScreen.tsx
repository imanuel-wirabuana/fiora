import { useState } from "react"
import {
  JournalFilterSection,
  JournalFormSection,
  JournalListSection,
  type PrivacyFilter,
} from "@/components/journal"
import { useActivities } from "@/hooks/useActivities"
import type { JournalActivityContent } from "@/types/activity"

export function JournalScreen() {
  const {
    visibleJournals,
    createJournal,
    toggleJournalPrivacy,
    deleteActivity,
    isLoading,
    createActivityMutation,
  } = useActivities()

  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all")
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSharedNew, setIsSharedNew] = useState(false) // Default is private

  const isSaving = createActivityMutation.isPending

  const filteredJournals = visibleJournals.filter((activity) => {
    const content = activity.content as JournalActivityContent | null
    if (!content) return false

    // Privacy filter
    if (privacyFilter === "private" && content.isShared) return false
    if (privacyFilter === "shared" && !content.isShared) return false

    // Search query
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      content.title.toLowerCase().includes(q) ||
      content.body.toLowerCase().includes(q)
    )
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    const newTitle = title.trim()
    const newBody = body.trim()
    const newIsShared = isSharedNew

    // Close form and reset fields immediately so optimistic entry shows up seamlessly
    setTitle("")
    setBody("")
    setIsSharedNew(false)
    setIsCreating(false)

    createJournal({
      title: newTitle,
      body: newBody,
      isShared: newIsShared,
    }).catch(() => {
      // Rollback is automatically handled by TanStack Query onMutate/onError
    })
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      deleteActivity(id).catch(() => {
        // Rollback handled by query mutation
      })
    }
  }

  const handleTogglePrivacy = (id: number, content: JournalActivityContent) => {
    toggleJournalPrivacy(id, content)
  }

  return (
    <section className="flex flex-col gap-4">
      <JournalFilterSection
        search={search}
        setSearch={setSearch}
        privacyFilter={privacyFilter}
        setPrivacyFilter={setPrivacyFilter}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
      />

      <JournalFormSection
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title={title}
        setTitle={setTitle}
        body={body}
        setBody={setBody}
        isShared={isSharedNew}
        setIsShared={setIsSharedNew}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <JournalListSection
        journals={filteredJournals}
        isLoading={isLoading}
        search={search}
        privacyFilter={privacyFilter}
        onTogglePrivacy={handleTogglePrivacy}
        onDelete={handleDelete}
      />
    </section>
  )
}

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
    deleteActivityMutation,
  } = useActivities()

  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all")
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSharedNew, setIsSharedNew] = useState(false) // Default is private

  const isSaving = createActivityMutation.isPending
  const isDeleting = deleteActivityMutation.isPending

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    await createJournal({
      title: title.trim(),
      body: body.trim(),
      isShared: isSharedNew,
    })

    setTitle("")
    setBody("")
    setIsSharedNew(false)
    setIsCreating(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      await deleteActivity(id)
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
        isDeleting={isDeleting}
        search={search}
        privacyFilter={privacyFilter}
        onTogglePrivacy={handleTogglePrivacy}
        onDelete={handleDelete}
      />
    </section>
  )
}

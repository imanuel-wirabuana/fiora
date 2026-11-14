import { useState } from "react"
import { useLocation } from "wouter"
import {
  JournalFilterSection,
  JournalFormSection,
  JournalListSection,
  type PrivacyFilter,
} from "@/components/journal"
import {
  useActivities,
  useInfiniteJournals,
} from "@/hooks/useActivities"
import type { JournalActivityContent } from "@/types/activity"

export function JournalScreen() {
  const [, setLocation] = useLocation()
  const {
    createJournal,
    toggleJournalPrivacy,
    deleteActivity,
    createActivityMutation,
  } = useActivities()
  const {
    visibleJournals,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteJournals()

  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all")
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState("")

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

  const handleSave = async () => {
    const newTitle = title.trim()
    if (!newTitle) return false

    try {
      const saved = await createJournal({
        title: newTitle,
        body: "",
        isShared: false,
      })
      setTitle("")
      setIsCreating(false)
      setLocation(`/journal/${saved.id}`)
      return true
    } catch {
      return false
    }
  }

  const handleDelete = (id: number) => {
    deleteActivity(id).catch(() => {
      // Rollback handled by query mutation
    })
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
        onClose={() => {
          setTitle("")
          setIsCreating(false)
        }}
        title={title}
        setTitle={setTitle}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <JournalListSection
        journals={filteredJournals}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        search={search}
        privacyFilter={privacyFilter}
        onTogglePrivacy={handleTogglePrivacy}
        onDelete={handleDelete}
      />
    </section>
  )
}

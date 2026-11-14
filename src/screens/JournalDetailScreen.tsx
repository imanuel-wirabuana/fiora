import { useCallback, useEffect, useRef, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ArrowLeft, BookOpen, Check, Globe, Lock, Trash2 } from "lucide-react"
import { useLocation, useRoute } from "wouter"
import { FormDrawer } from "@/components/FormDrawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { Spinner } from "@/components/ui/spinner"
import { useActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import { useScrollToTop } from "@/hooks/useScrollToTop"
import type { JournalActivityContent } from "@/types/activity"

export function JournalDetailScreen() {
  const [, setLocation] = useLocation()
  const [, params] = useRoute("/journal/:id")
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false)
  const [draft, setDraft] = useState<{
    id: number
    title: string
    body: string
  } | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  useScrollToTop(mainRef)

  const {
    visibleJournals,
    isLoading,
    toggleJournalPrivacy,
    updateJournal,
    deleteActivity,
  } = useActivities()
  const { currentMember, partnerMember } = useRelationship()
  const { user } = useAuth()

  const journalId = params?.id ? Number(params.id) : NaN
  const journal = visibleJournals.find((item) => item.id === journalId)
  const content = (journal?.content as JournalActivityContent | null) ?? null

  const isMe = journal?.user_id === user?.id
  const authorAvatar = isMe
    ? currentMember?.content?.avatar || "🙋"
    : partnerMember?.content?.avatar || "🤍"
  const authorName = isMe
    ? "You"
    : partnerMember?.content?.name || "Partner"

  const titleValue =
    journal && draft?.id === journal.id ? draft.title : (content?.title ?? "")
  const bodyValue =
    journal && draft?.id === journal.id ? draft.body : (content?.body ?? "")

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const persistDraft = useCallback(
    async (nextTitle: string, nextBody: string) => {
      if (!journal || !content || !isMe) return
      const trimmedTitle = nextTitle.trim()
      const trimmedBody = nextBody.trim()
      if (!trimmedTitle) return
      if (trimmedTitle === content.title && trimmedBody === content.body) {
        return
      }

      setSaveState("saving")
      try {
        await updateJournal({
          activityId: journal.id,
          content: {
            ...content,
            title: trimmedTitle,
            body: trimmedBody,
          },
        })
        setSaveState("saved")
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => {
          setSaveState("idle")
        }, 1500)
      } catch {
        setSaveState("idle")
      }
    },
    [journal, content, isMe, updateJournal]
  )

  const handleDraftChange = (nextTitle: string, nextBody: string) => {
    if (!journal) return
    setDraft({ id: journal.id, title: nextTitle, body: nextBody })
    setSaveState("idle")

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void persistDraft(nextTitle, nextBody)
    }, 600)
  }

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    void persistDraft(titleValue, bodyValue)
  }

  const handleBack = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
      void persistDraft(titleValue, bodyValue)
    }
    setLocation("/journal")
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background lg:h-full">
      {/* Top Floating Bar */}
      <header className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleBack}
            className="size-9 rounded-full border border-border/60 bg-background/90 shadow-xs hover:bg-muted/60"
            title="Back to journal"
            aria-label="Back to journal"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 shadow-xs">
            <BookOpen className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Journal
            </span>
          </div>

          {saveState === "saving" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Spinner className="size-3" />
              Saving
            </span>
          )}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" />
              Saved
            </span>
          )}
        </div>

        {journal && content && isMe && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                toggleJournalPrivacy(journal.id, {
                  ...content,
                  title: titleValue.trim() || content.title,
                  body: bodyValue.trim(),
                })
              }
              className="h-8 gap-1.5 rounded-full px-3 text-[11px]"
            >
              {content.isShared ? (
                <>
                  <Lock className="size-3" />
                  <span>Make Private</span>
                </>
              ) : (
                <>
                  <Globe className="size-3" />
                  <span>Share</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteDrawerOpen(true)}
              className="size-8 rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              title="Delete journal"
              aria-label="Delete journal"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </header>

      {/* Scrollable Full-Page Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto px-5 py-6">
        {isLoading ? (
          <div className="mx-auto flex max-w-md flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CustomSkeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <CustomSkeleton className="h-3.5 w-20 rounded-md" />
                  <CustomSkeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <CustomSkeleton className="h-5 w-16 rounded-full" />
            </div>
            <CustomSkeleton className="h-7 w-3/4 rounded-lg" />
            <div className="space-y-2.5 pt-2">
              <CustomSkeleton className="h-4 w-full rounded-md" />
              <CustomSkeleton className="h-4 w-11/12 rounded-md" />
              <CustomSkeleton className="h-4 w-4/5 rounded-md" />
              <CustomSkeleton className="h-4 w-full rounded-md" />
              <CustomSkeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>
        ) : !journal || !content ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <BookOpen className="size-8 opacity-40" />
            <p className="text-xs">Journal entry not found.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocation("/journal")}
              className="rounded-xl text-xs"
            >
              Back to Journal
            </Button>
          </div>
        ) : (
          <article className="mx-auto flex max-w-md flex-col gap-4">
            {/* Meta row: Author + Privacy Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-sm">
                  {authorAvatar}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {authorName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(journal.created_at), "MMM d, yyyy · h:mm a")}{" "}
                    ·{" "}
                    {formatDistanceToNow(new Date(journal.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {content.isShared ? (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-normal text-emerald-600 dark:text-emerald-400"
                >
                  <Globe className="size-2.5" />
                  Shared
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-normal text-amber-600 dark:text-amber-400"
                >
                  <Lock className="size-2.5" />
                  Private
                </Badge>
              )}
            </div>

            {/* Title & Body */}
            {isMe ? (
              <>
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => handleDraftChange(e.target.value, bodyValue)}
                  onBlur={handleBlur}
                  placeholder="Title"
                  aria-label="Journal title"
                  className="w-full border-0 bg-transparent p-0 text-base leading-snug font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                />

                <div className="border-t border-border/50 pt-4">
                  <textarea
                    value={bodyValue}
                    onChange={(e) =>
                      handleDraftChange(titleValue, e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="Write your thoughts..."
                    aria-label="Journal content"
                    className="field-sizing-content min-h-[50dvh] w-full resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                  />
                </div>
              </>
            ) : (
              <>
                <h1 className="text-base leading-snug font-semibold break-words text-foreground">
                  {content.title}
                </h1>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground/90">
                    {content.body}
                  </p>
                </div>
              </>
            )}
          </article>
        )}
      </main>

      <FormDrawer
        open={deleteDrawerOpen}
        onOpenChange={setDeleteDrawerOpen}
        title="Delete journal entry?"
        description={
          content ? `Permanently delete "${content.title}"?` : undefined
        }
        submitLabel="Delete"
        successLabel="Deleted!"
        onSubmit={async () => {
          if (!journal) return false
          try {
            await deleteActivity(journal.id)
            setLocation("/journal")
            return true
          } catch {
            return false
          }
        }}
      />
    </div>
  )
}

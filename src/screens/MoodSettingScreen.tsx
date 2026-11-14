import { useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Pencil,
  Plus,
  Smile,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useRelationship } from "@/hooks/useRelationship"
import { useSaveMoods } from "@/hooks/useSaveMoods"
import {
  assignMoodScoresByOrder,
  getMoodCategory,
  MAX_MOODS,
  MIN_MOODS,
} from "@/lib/relationship"
import { restrictToVerticalAxis } from "@/lib/dnd"
import { cn } from "@/lib/utils"
import type { MoodOption } from "@/types/relationship"

interface MoodItem {
  key: string
  emoji: string
  label: string
  score: number
}

function formatScoreText(score: number): string {
  return Number.isInteger(score) ? score.toFixed(1) : `${score}`
}

function getScoreBadgeStyles(score: number, index: number, total: number) {
  const category = getMoodCategory(index, total)
  const text = formatScoreText(score)

  switch (category) {
    case "very-good":
      return {
        text,
        label: "Very Good",
        className:
          "border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-400",
      }
    case "good":
      return {
        text,
        label: "Good",
        className:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      }
    case "neutral":
      return {
        text,
        label: "Neutral",
        className:
          "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      }
    case "bad":
      return {
        text,
        label: "Bad",
        className:
          "border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-400",
      }
    case "very-bad":
      return {
        text,
        label: "Very Bad",
        className:
          "border-destructive/30 bg-destructive/15 text-destructive",
      }
  }
}

interface SortableMoodRowProps {
  mood: MoodItem
  index: number
  total: number
  isSaving: boolean
  canRemove: boolean
  onEdit: () => void
  onDelete: () => void
}

function SortableMoodRow({
  mood,
  index,
  total,
  isSaving,
  canRemove,
  onEdit,
  onDelete,
}: SortableMoodRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mood.key, disabled: isSaving })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const badge = getScoreBadgeStyles(mood.score, index, total)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "group flex select-none items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5 transition-colors [-webkit-touch-callout:none] hover:border-border",
        isDragging
          ? "relative z-10 scale-[1.01] touch-none shadow-md ring-2 ring-primary/30"
          : "touch-manipulation"
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={isSaving}
        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-75"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 select-none">
          <AnimatedEmoji
            emoji={mood.emoji}
            size={28}
            replayOnTap={false}
            fallbackClassName="text-xl"
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-foreground">
            {mood.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium",
                badge.className
              )}
            >
              <Sparkles className="size-2.5 opacity-70" />
              {badge.text}
              <span className="text-[9px] opacity-75">({badge.label})</span>
            </span>
          </div>
        </div>
      </button>

      <div
        className="flex shrink-0 items-center gap-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          disabled={isSaving}
          title="Edit mood"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          disabled={!canRemove || isSaving}
          title={
            canRemove ? "Remove mood" : `At least ${MIN_MOODS} mood is required`
          }
          className="size-8 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-30"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Standalone screen for managing relationship moods (1-10 items),
 * automatically scored (0.1-1.0) and sorted good-to-bad via AI.
 */
export function MoodSettingScreen() {
  const {
    relationship,
    moodOptions,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()
  const saveMoodsMutation = useSaveMoods()

  // Optimistic local order while a drag-and-drop save is in flight
  const [pendingReorderedMoods, setPendingReorderedMoods] = useState<
    MoodOption[] | null
  >(null)

  // Drawer state for adding or editing a mood
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formEmoji, setFormEmoji] = useState("")
  const [formLabel, setFormLabel] = useState("")

  // AI Drawer state (rearrange only vs prompt AI)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [aiMode, setAiMode] = useState<"rearrange" | "prompt">("rearrange")
  const [aiPrompt, setAiPrompt] = useState("")

  // Delete confirmation drawer state
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeMoodOptions = pendingReorderedMoods ?? moodOptions

  const moodsList = useMemo<MoodItem[]>(
    () =>
      activeMoodOptions.map((m, idx) => ({
        key: `${m.label}-${idx}`,
        emoji: m.emoji,
        label: m.label,
        score: m.score,
      })),
    [activeMoodOptions]
  )

  const isSaving =
    saveMoodsMutation.isPending || updateRelationshipContentMutation.isPending
  const canAddMore = moodsList.length < MAX_MOODS
  const canRemove = moodsList.length > MIN_MOODS

  const formValid = useMemo(
    () => formEmoji.trim().length > 0 && formLabel.trim().length > 0,
    [formEmoji, formLabel]
  )

  if (!hasRelationship || !relationship) {
    return null
  }

  const openAddDrawer = () => {
    if (!canAddMore || isSaving) return
    setEditingIndex(null)
    setFormEmoji("")
    setFormLabel("")
    setDrawerOpen(true)
  }

  const openEditDrawer = (index: number) => {
    if (isSaving) return
    const target = moodsList[index]
    if (!target) return
    setEditingIndex(index)
    setFormEmoji(target.emoji)
    setFormLabel(target.label)
    setDrawerOpen(true)
  }

  const handleApplyDrawer = async () => {
    if (!formValid || isSaving) return false

    const emoji = formEmoji.trim()
    const label = formLabel.trim()

    let nextMoods: Array<{ emoji: string; label: string; score?: number }>

    if (editingIndex !== null) {
      nextMoods = moodsList.map((item, idx) =>
        idx === editingIndex
          ? { emoji, label } // score recalculates via AI
          : { emoji: item.emoji, label: item.label, score: item.score }
      )
    } else {
      if (!canAddMore) return false
      nextMoods = [
        ...moodsList.map((item) => ({
          emoji: item.emoji,
          label: item.label,
          score: item.score,
        })),
        { emoji, label },
      ]
    }

    try {
      await saveMoodsMutation.mutateAsync({
        relationshipId: relationship.id,
        moods: nextMoods,
      })
      return true
    } catch {
      return false
    }
  }

  const handleConfirmRemoveMood = async () => {
    if (deleteIndex === null || !canRemove || isSaving) return false
    const nextMoods = moodsList
      .filter((_, idx) => idx !== deleteIndex)
      .map((item) => ({
        emoji: item.emoji,
        label: item.label,
        score: item.score,
      }))

    try {
      await saveMoodsMutation.mutateAsync({
        relationshipId: relationship.id,
        moods: nextMoods,
      })
      return true
    } catch {
      return false
    }
  }

  const openAiDrawer = () => {
    if (isSaving) return
    saveMoodsMutation.reset()
    setAiDrawerOpen(true)
  }

  const handleApplyAiDrawer = async () => {
    if (isSaving) return false
    if (aiMode === "prompt" && !aiPrompt.trim()) return false

    try {
      await saveMoodsMutation.mutateAsync({
        relationshipId: relationship.id,
        moods: moodsList.map((item) => ({
          emoji: item.emoji,
          label: item.label,
          score: item.score,
        })),
        prompt: aiMode === "prompt" ? aiPrompt.trim() : undefined,
      })
      if (aiMode === "prompt") {
        setAiPrompt("")
      }
      return true
    } catch {
      return false
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || isSaving) return

    const oldIndex = moodsList.findIndex((m) => m.key === active.id)
    const newIndex = moodsList.findIndex((m) => m.key === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(moodsList, oldIndex, newIndex).map((item) => ({
      emoji: item.emoji,
      label: item.label,
    }))
    const reorderedWithScores = assignMoodScoresByOrder(reordered)

    setPendingReorderedMoods(reorderedWithScores)
    updateRelationshipContentMutation.mutate(
      {
        relationshipId: relationship.id,
        content: { moods: reorderedWithScores },
      },
      {
        onSettled: () => {
          setPendingReorderedMoods(null)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Info & Controls Card */}
      <CustomItem
        variant="solid"
        icon={<Smile className="size-4 text-primary-foreground" />}
        title="Your Moods"
        description={
          isSaving ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-primary-foreground">
              <Spinner className="size-3" />
              <span>Rearranging with AI...</span>
            </span>
          ) : (
            "Auto-scored and arranged from good to bad by AI"
          )
        }
        topRightActions={
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 font-mono text-[11px] font-medium text-primary-foreground">
              {moodsList.length}/{MAX_MOODS}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openAiDrawer}
              disabled={isSaving}
              title="AI Mood Assistant"
              className="h-8 gap-1 rounded-xl px-2.5 text-xs"
            >
              <Sparkles className="size-3.5" />
              AI
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openAddDrawer}
              disabled={!canAddMore || isSaving}
              className="h-8 gap-1 rounded-xl px-2.5 text-xs"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {saveMoodsMutation.isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
          {saveMoodsMutation.error.message ||
            "Failed to rearrange moods. Please try again."}
        </div>
      )}

      {/* Mood List - Sorted Good (top) to Bad (bottom), long-press to reorder */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={moodsList.map((m) => m.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {moodsList.map((mood, idx) => (
              <SortableMoodRow
                key={mood.key}
                mood={mood}
                index={idx}
                total={moodsList.length}
                isSaving={isSaving}
                canRemove={canRemove}
                onEdit={() => openEditDrawer(idx)}
                onDelete={() => {
                  saveMoodsMutation.reset()
                  setDeleteIndex(idx)
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add / Edit Mood FormDrawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingIndex !== null ? "Edit Mood" : "Add Mood"}
        description="AI will automatically score and sort this mood from good to bad based on its icon and label."
        onSubmit={handleApplyDrawer}
        submitLabel={editingIndex !== null ? "Save & Rearrange" : "Add & Rearrange"}
        successLabel="Rearranged!"
        isPending={isSaving}
        submitDisabled={!formValid}
      >
        {saveMoodsMutation.isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
            {saveMoodsMutation.error.message ||
              "Failed to rearrange moods. Please try again."}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2.5">
          <Field className="col-span-1 gap-1.5">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Emoji
            </FieldLabel>
            <Input
              type="text"
              placeholder="😊"
              value={formEmoji}
              onChange={(e) => setFormEmoji(e.target.value)}
              maxLength={4}
              autoFocus
              className="h-11 rounded-2xl text-center text-xl"
            />
          </Field>

          <Field className="col-span-3 gap-1.5">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Mood Label
            </FieldLabel>
            <Input
              type="text"
              placeholder="e.g. Cozy, Excited, Stressed"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              maxLength={20}
              className="h-11 rounded-2xl text-xs"
            />
          </Field>
        </div>

        {formEmoji.trim() && (
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3.5 py-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card select-none">
              <AnimatedEmoji
                emoji={formEmoji.trim()}
                size={28}
                fallbackClassName="text-xl"
              />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-medium text-muted-foreground">
                Lottie Preview
              </span>
              <span className="truncate text-xs font-medium text-foreground">
                {formLabel.trim() || "Mood label"}
              </span>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* AI Assistant FormDrawer */}
      <FormDrawer
        open={aiDrawerOpen}
        onOpenChange={setAiDrawerOpen}
        title="AI Mood Assistant"
        description="Rearrange your current moods or prompt AI to customize your mood list."
        onSubmit={handleApplyAiDrawer}
        submitLabel={aiMode === "rearrange" ? "Rearrange Moods" : "Apply AI Prompt"}
        successLabel="Done!"
        isPending={isSaving}
        submitDisabled={aiMode === "prompt" && !aiPrompt.trim()}
      >
        {saveMoodsMutation.isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
            {saveMoodsMutation.error.message ||
              "AI request failed. Please try again."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAiMode("rearrange")}
            className={cn(
              "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
              aiMode === "rearrange"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="size-3.5 text-primary" />
              <span>Rearrange Only</span>
            </div>
            <span className="text-[11px] leading-snug text-muted-foreground">
              Re-score & sort current moods good to bad
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAiMode("prompt")}
            className={cn(
              "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all",
              aiMode === "prompt"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Wand2 className="size-3.5 text-primary" />
              <span>Prompt AI</span>
            </div>
            <span className="text-[11px] leading-snug text-muted-foreground">
              Add, edit, or remove moods with a prompt
            </span>
          </button>
        </div>

        {aiMode === "prompt" && (
          <Field className="gap-1.5">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Your Prompt
            </FieldLabel>
            <Textarea
              placeholder="e.g. Add 2 cozy weekend moods, or replace Tired with Sleepy 😪"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              maxLength={300}
              autoFocus
              className="resize-none rounded-2xl text-xs"
            />
          </Field>
        )}
      </FormDrawer>

      {/* Delete Mood Confirmation FormDrawer */}
      <FormDrawer
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null)
        }}
        title="Remove mood?"
        description={
          deleteIndex !== null && moodsList[deleteIndex]
            ? `Remove "${moodsList[deleteIndex].emoji} ${moodsList[deleteIndex].label}" from your mood list?`
            : undefined
        }
        submitLabel="Remove"
        successLabel="Removed!"
        isPending={isSaving}
        onSubmit={handleConfirmRemoveMood}
      />
    </div>
  )
}

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
import { Pencil, Pin, Plus, Send, Trash2 } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useRelationship } from "@/hooks/useRelationship"
import {
  MAX_NUDGES,
  MAX_PINNED_NUDGES,
  MIN_NUDGES,
} from "@/lib/relationship"
import { cn } from "@/lib/utils"
import type { NudgeOption } from "@/types/relationship"

interface NudgeItem {
  key: string
  emoji: string
  label: string
  pinned: boolean
}

interface SortableNudgeRowProps {
  nudge: NudgeItem
  isSaving: boolean
  canRemove: boolean
  canPinMore: boolean
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}

function SortableNudgeRow({
  nudge,
  isSaving,
  canRemove,
  canPinMore,
  onTogglePin,
  onEdit,
  onDelete,
}: SortableNudgeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nudge.key, disabled: isSaving })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const pinDisabled = isSaving || (!nudge.pinned && !canPinMore)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "group flex select-none items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-2.5 transition-colors [-webkit-touch-callout:none] hover:border-border",
        nudge.pinned && "border-primary/30 bg-primary/[0.03]",
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
            emoji={nudge.emoji}
            size={28}
            replayOnTap={false}
            fallbackClassName="text-xl"
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-xs font-medium text-foreground">
            {nudge.label}
          </span>
          {nudge.pinned && (
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Pin className="size-2.5" />
                Pinned
              </span>
            </div>
          )}
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
          onClick={onTogglePin}
          disabled={pinDisabled}
          title={
            nudge.pinned
              ? "Unpin nudge"
              : canPinMore
                ? "Pin nudge"
                : `Max ${MAX_PINNED_NUDGES} pinned nudges`
          }
          className={cn(
            "size-8 transition-colors",
            nudge.pinned
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground disabled:opacity-30"
          )}
        >
          <Pin className={cn("size-3.5", nudge.pinned && "fill-current")} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          disabled={isSaving}
          title="Edit nudge"
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
            canRemove
              ? "Remove nudge"
              : `At least ${MIN_NUDGES} nudges are required`
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
 * Standalone screen for managing relationship nudges (3-11 items),
 * with drag-and-drop reordering and up to 3 pinned nudges.
 */
export function NudgeSettingScreen() {
  const {
    relationship,
    nudgeOptions,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  // Drawer state for adding or editing a nudge
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formEmoji, setFormEmoji] = useState("")
  const [formLabel, setFormLabel] = useState("")

  // Delete confirmation drawer state
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [isDrawerSaving, setIsDrawerSaving] = useState(false)

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

  const nudgesList = useMemo<NudgeItem[]>(
    () =>
      nudgeOptions.map((n, idx) => ({
        key: `${n.label}-${idx}`,
        emoji: n.emoji,
        label: n.label,
        pinned: Boolean(n.pinned),
      })),
    [nudgeOptions]
  )

  const pinnedCount = useMemo(
    () => nudgesList.filter((n) => n.pinned).length,
    [nudgesList]
  )

  const isSaving = isDrawerSaving
  const canAddMore = nudgesList.length < MAX_NUDGES
  const canRemove = nudgesList.length > MIN_NUDGES
  const canPinMore = pinnedCount < MAX_PINNED_NUDGES

  const formValid = useMemo(
    () => formEmoji.trim().length > 0 && formLabel.trim().length > 0,
    [formEmoji, formLabel]
  )

  if (!hasRelationship || !relationship) {
    return null
  }

  const serializeNudges = (items: NudgeItem[]): NudgeOption[] =>
    items.map((item) => ({
      emoji: item.emoji,
      label: item.label,
      ...(item.pinned ? { pinned: true } : {}),
    }))

  const saveNudgesFromDrawer = async (nextNudges: NudgeOption[]) => {
    setIsDrawerSaving(true)
    try {
      await updateRelationshipContentMutation.mutateAsync({
        relationshipId: relationship.id,
        content: { nudges: nextNudges },
      })
      return true
    } catch {
      return false
    } finally {
      setIsDrawerSaving(false)
    }
  }

  const openAddDrawer = () => {
    if (!canAddMore || isSaving) return
    updateRelationshipContentMutation.reset()
    setEditingIndex(null)
    setFormEmoji("")
    setFormLabel("")
    setDrawerOpen(true)
  }

  const openEditDrawer = (index: number) => {
    if (isSaving) return
    const target = nudgesList[index]
    if (!target) return
    updateRelationshipContentMutation.reset()
    setEditingIndex(index)
    setFormEmoji(target.emoji)
    setFormLabel(target.label)
    setDrawerOpen(true)
  }

  const handleApplyDrawer = async () => {
    if (!formValid || isSaving) return false

    const emoji = formEmoji.trim()
    const label = formLabel.trim()

    let nextNudges: NudgeOption[]

    if (editingIndex !== null) {
      nextNudges = serializeNudges(
        nudgesList.map((item, idx) =>
          idx === editingIndex ? { ...item, emoji, label } : item
        )
      )
    } else {
      if (!canAddMore) return false
      nextNudges = [
        ...serializeNudges(nudgesList),
        { emoji, label },
      ]
    }

    return saveNudgesFromDrawer(nextNudges)
  }

  const handleConfirmRemoveNudge = async () => {
    if (deleteIndex === null || !canRemove || isSaving) return false
    const nextNudges = serializeNudges(
      nudgesList.filter((_, idx) => idx !== deleteIndex)
    )
    return saveNudgesFromDrawer(nextNudges)
  }

  const handleTogglePin = (index: number) => {
    if (isSaving) return
    const target = nudgesList[index]
    if (!target) return
    if (!target.pinned && !canPinMore) return

    const nextNudges = serializeNudges(
      nudgesList.map((item, idx) =>
        idx === index ? { ...item, pinned: !item.pinned } : item
      )
    )
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { nudges: nextNudges },
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || isSaving) return

    const oldIndex = nudgesList.findIndex((n) => n.key === active.id)
    const newIndex = nudgesList.findIndex((n) => n.key === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = serializeNudges(arrayMove(nudgesList, oldIndex, newIndex))
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { nudges: reordered },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Info & Controls Card */}
      <CustomItem
        variant="solid"
        icon={<Send className="size-4 text-primary-foreground" />}
        title="Your Nudges"
        description={
          isSaving ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-primary-foreground">
              <Spinner className="size-3" />
              <span>Saving nudges...</span>
            </span>
          ) : (
            `Long-press to reorder • ${pinnedCount}/${MAX_PINNED_NUDGES} pinned`
          )
        }
        topRightActions={
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 font-mono text-[11px] font-medium text-primary-foreground">
              {nudgesList.length}/{MAX_NUDGES}
            </span>
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
      {updateRelationshipContentMutation.isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
          {updateRelationshipContentMutation.error.message ||
            "Failed to update nudges. Please try again."}
        </div>
      )}

      {/* Nudge List - Long-press to reorder */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={nudgesList.map((n) => n.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {nudgesList.map((nudge, idx) => (
              <SortableNudgeRow
                key={nudge.key}
                nudge={nudge}
                isSaving={isSaving}
                canRemove={canRemove}
                canPinMore={canPinMore}
                onTogglePin={() => handleTogglePin(idx)}
                onEdit={() => openEditDrawer(idx)}
                onDelete={() => {
                  updateRelationshipContentMutation.reset()
                  setDeleteIndex(idx)
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add / Edit Nudge FormDrawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingIndex !== null ? "Edit Nudge" : "Add Nudge"}
        description="Customize an emoji and quick message to send to your partner."
        onSubmit={handleApplyDrawer}
        submitLabel={editingIndex !== null ? "Save Nudge" : "Add Nudge"}
        successLabel="Saved!"
        isPending={isSaving}
        submitDisabled={!formValid}
      >
        {updateRelationshipContentMutation.isError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
            {updateRelationshipContentMutation.error.message ||
              "Failed to save nudge. Please try again."}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2.5">
          <Field className="col-span-1 gap-1.5">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Emoji
            </FieldLabel>
            <Input
              type="text"
              placeholder="💌"
              value={formEmoji}
              onChange={(e) => setFormEmoji(e.target.value)}
              maxLength={4}
              autoFocus
              className="h-11 rounded-2xl text-center text-xl"
            />
          </Field>

          <Field className="col-span-3 gap-1.5">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Nudge Message
            </FieldLabel>
            <Input
              type="text"
              placeholder="e.g. Thinking of you, Need a hug"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              maxLength={24}
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
                {formLabel.trim() || "Nudge message"}
              </span>
            </div>
          </div>
        )}
      </FormDrawer>

      {/* Delete Nudge Confirmation FormDrawer */}
      <FormDrawer
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null)
        }}
        title="Remove nudge?"
        description={
          deleteIndex !== null && nudgesList[deleteIndex]
            ? `Remove "${nudgesList[deleteIndex].emoji} ${nudgesList[deleteIndex].label}" from your nudge list?`
            : undefined
        }
        onSubmit={handleConfirmRemoveNudge}
        submitLabel="Remove"
        submitVariant="destructive"
        successLabel="Removed"
        isPending={isSaving}
      />
    </div>
  )
}

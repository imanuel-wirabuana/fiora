import { Plus, RotateCcw, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { useRelationship } from "@/hooks/useRelationship"
import { DEFAULT_NUDGE_OPTIONS } from "@/lib/relationship"
import type { NudgeOption } from "@/types/relationship"

const MAX_NUDGES = 5

export function NudgesSection() {
  const {
    relationship,
    nudgeOptions,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  const [isAdding, setIsAdding] = useState(false)
  const [newEmoji, setNewEmoji] = useState("")
  const [newLabel, setNewLabel] = useState("")

  if (!hasRelationship || !relationship) {
    return null
  }

  const isMaxReached = nudgeOptions.length >= MAX_NUDGES

  const handleSaveNudges = (updatedNudges: NudgeOption[]) => {
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { nudges: updatedNudges },
    })
  }

  const handleRemoveNudge = (index: number) => {
    if (nudgeOptions.length <= 1) return
    const updated = nudgeOptions.filter((_, i) => i !== index)
    handleSaveNudges(updated)
  }

  const handleAddNudge = (e: React.FormEvent) => {
    e.preventDefault()
    if (isMaxReached) return
    const trimmedEmoji = newEmoji.trim()
    const trimmedLabel = newLabel.trim()
    if (!trimmedEmoji || !trimmedLabel) return

    const newNudge: NudgeOption = {
      emoji: trimmedEmoji,
      label: trimmedLabel,
    }

    handleSaveNudges([...nudgeOptions, newNudge])
    setNewEmoji("")
    setNewLabel("")
    setIsAdding(false)
  }

  const handleResetDefaults = () => {
    handleSaveNudges(DEFAULT_NUDGE_OPTIONS)
  }

  return (
    <Item
      variant="outline"
      className="w-full flex-col items-start gap-2.5 p-3.5"
    >
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <ItemTitle className="text-sm font-semibold">Nudges</ItemTitle>
          <span className="text-[11px] text-muted-foreground font-mono">
            ({nudgeOptions.length}/{MAX_NUDGES})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleResetDefaults}
            title="Reset to default nudges"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setIsAdding(!isAdding)}
            disabled={isMaxReached && !isAdding}
            className="h-6 gap-1 px-2 text-[11px]"
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>
      </ItemHeader>

      <ItemContent className="w-full space-y-2">
        <ItemDescription className="text-[11px] text-muted-foreground">
          Quick tap interactions you can send to your partner.
        </ItemDescription>

        {/* Nudge Pills Grid */}
        <div className="grid grid-cols-1 gap-1.5 pt-0.5 sm:grid-cols-2">
          {nudgeOptions.map((nudge, idx) => (
            <div
              key={`${nudge.label}-${idx}`}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="shrink-0 text-sm">{nudge.emoji}</span>
                <span className="truncate">{nudge.label}</span>
              </div>
              {nudgeOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveNudge(idx)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                  title="Remove nudge"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Inline Add Nudge Form */}
        {isAdding && (
          <form
            onSubmit={handleAddNudge}
            className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-2 pt-1.5 text-xs"
          >
            <Input
              type="text"
              placeholder="Emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="h-7 w-14 px-1.5 text-center text-sm"
              maxLength={4}
              autoFocus
            />
            <Input
              type="text"
              placeholder="Label (e.g. Miss you)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-7 flex-1 px-2 text-xs"
              maxLength={30}
            />
            <Button
              type="submit"
              size="xs"
              disabled={
                isMaxReached ||
                !newEmoji.trim() ||
                !newLabel.trim()
              }
              className="h-7 gap-1 px-2.5 text-[11px]"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsAdding(false)}
              className="h-7 w-7 text-muted-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </form>
        )}
      </ItemContent>
    </Item>
  )
}

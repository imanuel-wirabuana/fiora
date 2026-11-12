import { Plus, RotateCcw, Smile, X } from "lucide-react"
import { useState } from "react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRelationship } from "@/hooks/useRelationship"
import { DEFAULT_MOOD_OPTIONS } from "@/lib/relationship"
import type { MoodOption } from "@/types/relationship"

const MAX_MOODS = 10

export function MoodsSection() {
  const {
    relationship,
    moodOptions,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  const [isAdding, setIsAdding] = useState(false)
  const [newEmoji, setNewEmoji] = useState("")
  const [newLabel, setNewLabel] = useState("")

  if (!hasRelationship || !relationship) {
    return null
  }

  const isMaxReached = moodOptions.length >= MAX_MOODS

  const handleSaveMoods = (updatedMoods: MoodOption[]) => {
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { moods: updatedMoods },
    })
  }

  const handleRemoveMood = (index: number) => {
    if (moodOptions.length <= 1) return
    const updated = moodOptions.filter((_, i) => i !== index)
    handleSaveMoods(updated)
  }

  const handleAddMood = (e: React.FormEvent) => {
    e.preventDefault()
    if (isMaxReached) return
    const trimmedEmoji = newEmoji.trim()
    const trimmedLabel = newLabel.trim()
    if (!trimmedEmoji || !trimmedLabel) return

    const updated = [
      ...moodOptions,
      { emoji: trimmedEmoji, label: trimmedLabel },
    ]
    handleSaveMoods(updated)
    setNewEmoji("")
    setNewLabel("")
    setIsAdding(false)
  }

  const handleResetDefaults = () => {
    handleSaveMoods(DEFAULT_MOOD_OPTIONS)
  }

  return (
    <CustomItem
      icon={<Smile className="size-3.5 text-primary" />}
      title="Mood Options"
      topRightActions={
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[11px] text-muted-foreground">
            ({moodOptions.length}/{MAX_MOODS})
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleResetDefaults}
            title="Reset to default moods"
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
      }
      description="Moods you and your partner can select on the home screen."
      descriptionClassName="text-[11px]"
      contentClassName="space-y-2"
    >
      {/* Mood Badges List */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {moodOptions.map((mood, idx) => (
          <span
            key={`${mood.label}-${idx}`}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <span className="text-sm">{mood.emoji}</span>
            <span>{mood.label}</span>
            {moodOptions.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveMood(idx)}
                className="-mr-0.5 ml-0.5 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                title="Remove mood"
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Inline Add Mood Form */}
      {isAdding && (
        <form
          onSubmit={handleAddMood}
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
            placeholder="Label (e.g. Cozy)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="h-7 flex-1 px-2 text-xs"
            maxLength={20}
          />
          <Button
            type="submit"
            size="xs"
            disabled={isMaxReached || !newEmoji.trim() || !newLabel.trim()}
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
    </CustomItem>
  )
}

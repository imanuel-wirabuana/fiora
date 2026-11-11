import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { DEFAULT_MOOD_OPTIONS } from "@/lib/relationship"
import type { MoodOption } from "@/types/relationship"

interface MoodsStepProps {
  moods: MoodOption[]
  onChangeMoods: (moods: MoodOption[]) => void
}

export function MoodsStep({ moods, onChangeMoods }: MoodsStepProps) {
  const [activeMoodIndex, setActiveMoodIndex] = useState(0)

  const handleUpdateMood = (index: number, updates: Partial<MoodOption>) => {
    const updated = moods.map((m, i) =>
      i === index ? { ...m, ...updates } : m
    )
    onChangeMoods(updated)
  }

  const handleReset = () => {
    onChangeMoods(DEFAULT_MOOD_OPTIONS)
  }

  const activeMood = moods[activeMoodIndex] || moods[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Customize Moods (Optional)
          </h3>
          <p className="text-xs text-muted-foreground">
            Tap a mood button to edit its emoji and label
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1 size-3.5" />
          Reset
        </Button>
      </div>

      {/* Horizontal Mood Selector UI - Mimicking MoodDrawer */}
      <div className="grid grid-cols-5 gap-2 pt-1 pb-1">
        {moods.map((mood, idx) => {
          const isSelected = activeMoodIndex === idx
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveMoodIndex(idx)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all outline-none active:scale-95",
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <span className="text-2xl leading-none">
                {mood.emoji || "❓"}
              </span>
              <span
                className={cn(
                  "w-full truncate text-center text-[10px] leading-none font-medium",
                  isSelected
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
                )}
              >
                {mood.label || `Mood ${idx + 1}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Inline Editor for the Selected Mood */}
      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3.5">
        <div className="grid grid-cols-4 gap-2.5">
          {/* Emoji Input */}
          <Field className="col-span-1 gap-1">
            <FieldLabel className="text-[10px] font-medium text-muted-foreground">
              Emoji
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
              <InputGroupInput
                value={activeMood.emoji}
                maxLength={4}
                onChange={(e) =>
                  handleUpdateMood(activeMoodIndex, { emoji: e.target.value })
                }
                className="text-center text-lg"
                aria-label={`Slot ${activeMoodIndex + 1} emoji`}
              />
            </InputGroup>
          </Field>

          {/* Label Input */}
          <Field className="col-span-3 gap-1">
            <FieldLabel className="text-[10px] font-medium text-muted-foreground">
              Mood Label
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
              <InputGroupAddon
                align="inline-start"
                className="pl-3 text-xs text-muted-foreground/50"
              >
                Name
              </InputGroupAddon>
              <InputGroupInput
                value={activeMood.label}
                maxLength={15}
                onChange={(e) =>
                  handleUpdateMood(activeMoodIndex, { label: e.target.value })
                }
                className="text-xs font-medium"
                aria-label={`Slot ${activeMoodIndex + 1} label`}
              />
            </InputGroup>
          </Field>
        </div>
      </div>
    </div>
  )
}

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { DEFAULT_MOOD_OPTIONS } from "@/lib/relationship"
import type { MoodOption } from "@/types/relationship"

interface MoodsStepProps {
  moods: MoodOption[]
  onChangeMoods: (moods: MoodOption[]) => void
}

export function MoodsStep({ moods, onChangeMoods }: MoodsStepProps) {
  const handleUpdateMood = (index: number, updates: Partial<MoodOption>) => {
    const updated = moods.map((m, i) => (i === index ? { ...m, ...updates } : m))
    onChangeMoods(updated)
  }

  const handleReset = () => {
    onChangeMoods(DEFAULT_MOOD_OPTIONS)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            Customize Moods (Optional)
          </h3>
          <p className="text-xs text-muted-foreground">
            Customize the 5 quick mood check-ins for your relationship
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-3 pt-1">
        {moods.map((mood, idx) => (
          <Field key={idx} className="gap-1">
            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
              Mood {idx + 1}
            </FieldLabel>
            <div className="flex items-center gap-2">
              {/* Emoji input */}
              <div className="w-16 shrink-0">
                <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
                  <InputGroupInput
                    value={mood.emoji}
                    maxLength={2}
                    onChange={(e) => handleUpdateMood(idx, { emoji: e.target.value })}
                    className="text-center text-lg"
                    aria-label={`Mood ${idx + 1} emoji`}
                  />
                </InputGroup>
              </div>

              {/* Label input */}
              <div className="flex-1">
                <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
                  <InputGroupAddon align="inline-start" className="text-muted-foreground/50 text-xs pl-3">
                    Label
                  </InputGroupAddon>
                  <InputGroupInput
                    value={mood.label}
                    maxLength={15}
                    onChange={(e) => handleUpdateMood(idx, { label: e.target.value })}
                    className="text-xs font-medium"
                    aria-label={`Mood ${idx + 1} label`}
                  />
                </InputGroup>
              </div>
            </div>
          </Field>
        ))}
      </div>
    </div>
  )
}


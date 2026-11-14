import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { DEFAULT_NUDGE_OPTIONS } from "@/lib/relationship"
import type { NudgeOption } from "@/types/relationship"

interface NudgesStepProps {
  nudges: NudgeOption[]
  onChangeNudges: (nudges: NudgeOption[]) => void
}

export function NudgesStep({ nudges, onChangeNudges }: NudgesStepProps) {
  const [activeNudgeIndex, setActiveNudgeIndex] = useState(0)

  const handleUpdateNudge = (index: number, updates: Partial<NudgeOption>) => {
    const updated = nudges.map((n, i) =>
      i === index ? { ...n, ...updates } : n
    )
    onChangeNudges(updated)
  }

  const handleReset = () => {
    onChangeNudges(DEFAULT_NUDGE_OPTIONS)
  }

  const activeNudge = nudges[activeNudgeIndex] || nudges[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
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

      {/* Horizontal Nudges Grid */}
      <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
        {nudges.map((nudge, idx) => {
          const isSelected = activeNudgeIndex === idx
          return (
            <button
              key={`${nudge.label}-${idx}`}
              type="button"
              onClick={() => setActiveNudgeIndex(idx)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all outline-none active:scale-95",
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <AnimatedEmoji
                emoji={nudge.emoji || "💬"}
                size={28}
                replayOnTap={false}
                className="shrink-0"
                fallbackClassName="text-2xl leading-none"
              />
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  isSelected ? "font-semibold text-primary" : "text-foreground"
                )}
              >
                {nudge.label || `Nudge ${idx + 1}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Inline Editor for the Selected Nudge */}
      <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3.5">
        <div className="grid grid-cols-4 gap-2.5">
          {/* Emoji Input */}
          <Field className="col-span-1 gap-1">
            <FieldLabel className="text-[10px] font-medium text-muted-foreground">
              Emoji
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
              <InputGroupInput
                value={activeNudge.emoji}
                maxLength={4}
                onChange={(e) =>
                  handleUpdateNudge(activeNudgeIndex, { emoji: e.target.value })
                }
                className="text-center text-lg"
                aria-label={`Nudge ${activeNudgeIndex + 1} emoji`}
              />
            </InputGroup>
          </Field>

          {/* Label Input */}
          <Field className="col-span-3 gap-1">
            <FieldLabel className="text-[10px] font-medium text-muted-foreground">
              Message
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary">
              <InputGroupAddon
                align="inline-start"
                className="pl-3 text-xs text-muted-foreground/50"
              >
                Text
              </InputGroupAddon>
              <InputGroupInput
                value={activeNudge.label}
                maxLength={25}
                onChange={(e) =>
                  handleUpdateNudge(activeNudgeIndex, { label: e.target.value })
                }
                className="text-xs font-medium"
                aria-label={`Nudge ${activeNudgeIndex + 1} message`}
              />
            </InputGroup>
          </Field>
        </div>
      </div>
    </div>
  )
}

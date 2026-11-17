import { useState } from "react"
import { Plus } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { DEFAULT_AVATARS_BY_GENDER } from "@/lib/relationship"
import { cn } from "@/lib/utils"
import type { Gender } from "@/types/relationship"

export interface AvatarPickerProps {
  gender: Gender | null | undefined
  value: string
  onChange: (avatar: string) => void
  fallbackAvatar?: string
  disabled?: boolean
  className?: string
}

/**
 * 6-slot emoji avatar grid with gender presets and a custom emoji input slot.
 */
export function AvatarPicker({
  gender,
  value,
  onChange,
  fallbackAvatar,
  disabled = false,
  className,
}: AvatarPickerProps) {
  const [isCustomFocused, setIsCustomFocused] = useState(false)
  const genderKey = gender || "male"
  const avatarOptions = DEFAULT_AVATARS_BY_GENDER[genderKey]
  const trimmedAvatar = value.trim()
  const isCustomAvatar =
    Boolean(trimmedAvatar) && !avatarOptions.includes(trimmedAvatar)

  return (
    <div className={cn("grid grid-cols-6 gap-2", className)}>
      {avatarOptions.map((opt) => {
        const isSelected = value === opt
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-2xl border text-2xl transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
              isSelected
                ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
                : "border-border hover:bg-muted/40"
            )}
            aria-label={`Avatar ${opt}`}
          >
            <AnimatedEmoji
              emoji={opt}
              size={28}
              replayOnTap={false}
              fallbackClassName="text-2xl"
            />
          </button>
        )
      })}

      <div
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-2xl border transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
          isCustomAvatar
            ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
            : "border-dashed border-border hover:bg-muted/40",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {!isCustomFocused &&
          (isCustomAvatar ? (
            <AnimatedEmoji
              emoji={trimmedAvatar}
              size={28}
              replayOnTap={false}
              fallbackClassName="text-2xl"
            />
          ) : (
            <Plus className="size-4 text-muted-foreground" />
          ))}
        <input
          type="text"
          disabled={disabled}
          value={isCustomAvatar || isCustomFocused ? value : ""}
          onFocus={() => {
            setIsCustomFocused(true)
            if (!isCustomAvatar) {
              onChange("")
            }
          }}
          onBlur={() => {
            setIsCustomFocused(false)
            if (!value.trim()) {
              onChange(fallbackAvatar || avatarOptions[0])
            }
          }}
          onChange={(e) => onChange(e.target.value)}
          maxLength={4}
          aria-label="Custom avatar emoji"
          title="Custom emoji"
          className={cn(
            "absolute inset-0 size-full cursor-pointer rounded-2xl bg-transparent text-center text-xl outline-none",
            !isCustomFocused && "text-transparent caret-transparent"
          )}
        />
      </div>
    </div>
  )
}

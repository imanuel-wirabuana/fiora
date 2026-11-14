import { useState } from "react"
import { Plus, User } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { DEFAULT_AVATARS_BY_GENDER } from "@/lib/relationship"
import type { Gender } from "@/types/relationship"

interface ProfileStepProps {
  gender: Gender | null
  name: string
  avatar: string
  onChangeName: (name: string) => void
  onChangeAvatar: (avatar: string) => void
  error?: string | null
}

export function ProfileStep({
  gender,
  name,
  avatar,
  onChangeName,
  onChangeAvatar,
  error,
}: ProfileStepProps) {
  const [isCustomFocused, setIsCustomFocused] = useState(false)
  const genderKey = gender || "male"
  const avatarOptions = DEFAULT_AVATARS_BY_GENDER[genderKey]
  const trimmedAvatar = avatar.trim()
  const isCustomAvatar =
    Boolean(trimmedAvatar) && !avatarOptions.includes(trimmedAvatar)

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar Picker */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          Select Avatar
        </span>
        <div className="grid grid-cols-6 gap-2">
          {avatarOptions.map((opt) => {
            const isSelected = avatar === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeAvatar(opt)}
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl border text-2xl transition-all active:scale-95",
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
              "relative flex size-12 items-center justify-center rounded-2xl border transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
              isCustomAvatar
                ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
                : "border-dashed border-border hover:bg-muted/40"
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
              value={isCustomAvatar || isCustomFocused ? avatar : ""}
              onFocus={() => {
                setIsCustomFocused(true)
                if (!isCustomAvatar) {
                  onChangeAvatar("")
                }
              }}
              onBlur={() => {
                setIsCustomFocused(false)
                if (!avatar.trim()) {
                  onChangeAvatar(avatarOptions[0])
                }
              }}
              onChange={(e) => onChangeAvatar(e.target.value)}
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
      </div>

      {/* Name Input */}
      <Field className="gap-1.5" data-invalid={!!error}>
        <FieldLabel
          htmlFor="profile-name"
          className="text-xs font-medium text-muted-foreground"
        >
          Your Name / Nickname
        </FieldLabel>
        <InputGroup className="h-10 rounded-2xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <InputGroupAddon
            align="inline-start"
            className="pl-3 text-muted-foreground/60"
          >
            <User className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            id="profile-name"
            required
            placeholder="e.g. Alex or Honey"
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            className="text-sm placeholder:text-muted-foreground/60"
          />
        </InputGroup>
      </Field>
    </div>
  )
}

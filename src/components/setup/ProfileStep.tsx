import { User } from "lucide-react"
import { AvatarPicker } from "@/components/pickers"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  return (
    <div className="flex flex-col gap-5">
      {/* Avatar Picker */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          Select Avatar
        </span>
        <AvatarPicker
          gender={gender}
          value={avatar}
          onChange={onChangeAvatar}
        />
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

import { useState } from "react"
import { User } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRelationship } from "@/hooks/useRelationship"
import { DEFAULT_AVATARS_BY_GENDER, getDefaultAvatar } from "@/lib/relationship"
import { cn } from "@/lib/utils"
import { SettingRow } from "./SettingRow"

export function ProfileSection() {
  const { currentMember, updateMemberContentMutation } = useRelationship()
  const savedName = currentMember?.content?.name || ""
  const currentGender = currentMember?.content?.gender || "male"
  const savedAvatar =
    currentMember?.content?.avatar ||
    getDefaultAvatar(currentMember?.content?.gender || null)

  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState(savedName)
  const [draftAvatar, setDraftAvatar] = useState(savedAvatar)

  if (!currentMember) {
    return null
  }

  const isPending = updateMemberContentMutation.isPending
  const trimmedName = draftName.trim()
  const isChanged = trimmedName !== savedName || draftAvatar !== savedAvatar
  const avatarOptions =
    DEFAULT_AVATARS_BY_GENDER[currentGender] || DEFAULT_AVATARS_BY_GENDER.male

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftName(savedName)
      setDraftAvatar(savedAvatar)
    }
    setOpen(next)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmedName || !isChanged) {
      return false
    }

    updateMemberContentMutation.mutate({
      memberId: currentMember.id,
      content: { name: trimmedName, avatar: draftAvatar },
    })
  }

  return (
    <SettingRow
      icon={<User className="size-3.5" />}
      title="Profile"
      description={
        currentMember.content?.gender
          ? `Gender: ${currentMember.content.gender}`
          : "Customize your name and avatar."
      }
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title="Edit Profile"
          description="Update your avatar and display name."
          onSubmit={handleSubmit}
          submitLabel="Save"
          isPending={isPending}
          submitDisabled={!trimmedName || !isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 max-w-[140px] gap-1.5 rounded-xl px-2.5 text-xs font-medium"
            >
              <AnimatedEmoji
                emoji={savedAvatar}
                size={16}
                replayOnTap={false}
                className="shrink-0"
                fallbackClassName="text-xs"
              />
              <span className="truncate">{savedName || "Set profile"}</span>
            </Button>
          }
        >
          <div className="grid grid-cols-6 gap-2">
            {avatarOptions.map((opt) => {
              const isSelected = opt === draftAvatar
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDraftAvatar(opt)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border text-2xl transition-all active:scale-95",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:bg-muted/40"
                  )}
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
          </div>

          <Input
            type="text"
            placeholder="Your name or nickname"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={30}
            className="h-10 rounded-2xl px-3.5 text-xs"
          />
        </FormDrawer>
      }
    />
  )
}

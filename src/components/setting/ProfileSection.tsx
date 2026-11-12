import { Check, ChevronDown, User } from "lucide-react"
import { useState } from "react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { useRelationship } from "@/hooks/useRelationship"
import { DEFAULT_AVATARS_BY_GENDER, getDefaultAvatar } from "@/lib/relationship"
import { cn } from "@/lib/utils"

export function ProfileSection() {
  const { currentMember, updateMemberContentMutation } = useRelationship()
  const savedName = currentMember?.content?.name || ""
  const currentGender = currentMember?.content?.gender || "male"
  const savedAvatar =
    currentMember?.content?.avatar || getDefaultAvatar(currentMember?.content?.gender || null)

  const [name, setName] = useState(savedName)
  const [prevSavedName, setPrevSavedName] = useState(savedName)
  const [saved, setSaved] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  // Sync state if remote savedName changes without cascading renders
  if (savedName !== prevSavedName) {
    setPrevSavedName(savedName)
    setName(savedName)
  }

  if (!currentMember) {
    return null
  }

  const isPending = updateMemberContentMutation.isPending
  const isNameChanged = name.trim() !== savedName
  const avatarOptions = DEFAULT_AVATARS_BY_GENDER[currentGender] || DEFAULT_AVATARS_BY_GENDER.male

  const handleSaveName = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === savedName) return

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    updateMemberContentMutation.mutate({
      memberId: currentMember.id,
      content: { name: trimmed },
    })
  }

  const handleSelectAvatar = (newAvatar: string) => {
    setAvatarOpen(false)
    if (newAvatar === savedAvatar) {
      return
    }

    updateMemberContentMutation.mutate({
      memberId: currentMember.id,
      content: { avatar: newAvatar },
    })
  }

  return (
    <CustomItem
      icon={<User className="size-3.5 text-primary" />}
      title="Profile"
      topRightActions={
        <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
          {currentMember.content?.gender || "Member"}
        </span>
      }
    >
      <form onSubmit={handleSaveName} className="flex w-full items-center gap-2">
        {/* Avatar Selector Trigger */}
        <Popover open={avatarOpen} onOpenChange={setAvatarOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                title="Change avatar"
                className={cn(
                  "relative flex h-8 shrink-0 items-center gap-0.5 rounded-xl border border-input bg-background px-2 text-base transition-colors outline-none hover:bg-muted/40 focus:border-primary"
                )}
              />
            }
          >
            <span>{savedAvatar}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto rounded-2xl border border-border p-2 shadow-lg"
          >
            <div className="grid grid-cols-6 gap-1.5">
              {avatarOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectAvatar(opt)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border text-xl transition-all active:scale-95",
                    opt === savedAvatar
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Name Input */}
        <Input
          type="text"
          placeholder="Your name or nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          className="h-8 flex-1 px-2.5 text-xs"
        />

        {/* Save Name Button */}
        <Button
          type="submit"
          size="xs"
          disabled={!isNameChanged || !name.trim()}
          className="h-8 gap-1 px-3 text-[11px]"
        >
          {saved ? (
            <>
              <Check className="size-3 text-emerald-400" /> Saved
            </>
          ) : isPending ? (
            <Spinner className="size-3" />
          ) : (
            "Save"
          )}
        </Button>
      </form>
    </CustomItem>
  )
}

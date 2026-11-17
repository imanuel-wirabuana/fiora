import { useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Smile, User } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { AvatarPicker, CustomDatePicker } from "@/components/pickers"
import { SettingRow } from "@/components/setting/SettingRow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useRelationship } from "@/hooks/useRelationship"
import {
  getDaysUntilNextBirthday,
  getDefaultAvatar,
  getZodiacSign,
} from "@/lib/relationship"

function parseBirthDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

function AvatarSettingRow() {
  const { currentMember, updateMemberContentMutation } = useRelationship()
  const currentGender = currentMember?.content?.gender || "male"
  const savedAvatar =
    currentMember?.content?.avatar ||
    getDefaultAvatar(currentMember?.content?.gender || null)

  const [open, setOpen] = useState(false)
  const [draftAvatar, setDraftAvatar] = useState(savedAvatar)

  if (!currentMember) return null

  const isPending = updateMemberContentMutation.isPending
  const trimmedAvatar = draftAvatar.trim()
  const isChanged = trimmedAvatar !== savedAvatar

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftAvatar(savedAvatar)
    }
    setOpen(next)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmedAvatar || !isChanged) return false

    try {
      await updateMemberContentMutation.mutateAsync({
        memberId: currentMember.id,
        content: { avatar: trimmedAvatar },
      })
    } catch {
      return false
    }
  }

  return (
    <SettingRow
      icon={<Smile className="size-3.5" />}
      title="Avatar"
      description="Choose an emoji that represents you."
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title="Edit Avatar"
          description="Pick an icon or enter a custom emoji."
          onSubmit={handleSubmit}
          submitLabel="Save"
          isPending={isPending}
          submitDisabled={!trimmedAvatar || !isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 gap-1.5 rounded-xl px-2.5 text-xs font-medium"
            >
              <AnimatedEmoji
                emoji={savedAvatar}
                size={16}
                replayOnTap={false}
                className="shrink-0"
                fallbackClassName="text-xs"
              />
              <span>Change</span>
            </Button>
          }
        >
          <AvatarPicker
            gender={currentGender}
            value={draftAvatar}
            onChange={setDraftAvatar}
            fallbackAvatar={savedAvatar}
            disabled={isPending}
          />
        </FormDrawer>
      }
    />
  )
}

function NameSettingRow() {
  const { currentMember, updateMemberContentMutation } = useRelationship()
  const savedName = currentMember?.content?.name || ""

  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState(savedName)

  if (!currentMember) return null

  const isPending = updateMemberContentMutation.isPending
  const trimmedName = draftName.trim()
  const isChanged = trimmedName !== savedName

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftName(savedName)
    }
    setOpen(next)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmedName || !isChanged) return false

    try {
      await updateMemberContentMutation.mutateAsync({
        memberId: currentMember.id,
        content: { name: trimmedName },
      })
    } catch {
      return false
    }
  }

  return (
    <SettingRow
      icon={<User className="size-3.5" />}
      title="Name"
      description="Display name your partner sees."
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title="Edit Name"
          description="Update your display name or nickname."
          onSubmit={handleSubmit}
          submitLabel="Save"
          isPending={isPending}
          submitDisabled={!trimmedName || !isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 max-w-[140px] rounded-xl px-2.5 text-xs font-medium"
            >
              <span className="truncate">{savedName || "Set name"}</span>
            </Button>
          }
        >
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

function BirthDateSettingRow() {
  const { currentMember, updateMemberContentMutation } = useRelationship()

  if (!currentMember) return null

  const selectedDate = parseBirthDate(currentMember.content?.birth_date)

  const handleDateChange = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd")
    updateMemberContentMutation.mutate({
      memberId: currentMember.id,
      content: { birth_date: formatted },
    })
  }

  const description = selectedDate
    ? (() => {
        const zodiac = getZodiacSign(selectedDate)
        const days = getDaysUntilNextBirthday(selectedDate)
        const countdown =
          days === 0
            ? "Birthday today!"
            : days === 1
              ? "Birthday tomorrow"
              : `Birthday in ${days} days`
        return `${zodiac} · ${countdown}`
      })()
    : "Set your birthday."

  return (
    <SettingRow
      icon={<CalendarIcon className="size-3.5" />}
      title="Birth Date"
      description={description}
      action={
        <CustomDatePicker
          variant="default"
          value={selectedDate}
          onChange={handleDateChange}
          minDate={new Date(1920, 0, 1)}
          maxDate={new Date()}
          title="Birth Date"
          description="When is your birthday?"
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 rounded-xl px-2.5 text-xs font-medium"
            >
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Set date"}
            </Button>
          }
        />
      }
    />
  )
}

export function ProfileSettingScreen() {
  const { currentMember, hasRelationship } = useRelationship()

  if (!hasRelationship || !currentMember) {
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-20 sm:max-w-2xl">
      <CustomItem
        icon={<User className="size-3.5 text-primary" />}
        title="Profile"
        contentClassName="flex flex-col gap-0.5"
      >
        <AvatarSettingRow />
        <Separator />
        <NameSettingRow />
        <Separator />
        <BirthDateSettingRow />
      </CustomItem>
    </div>
  )
}

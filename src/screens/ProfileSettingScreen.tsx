import { useState } from "react"
import { format, isValid, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Smile, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { AvatarPicker, CustomDatePicker } from "@/components/pickers"
import { SettingRow } from "@/components/setting/SettingRow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useRelationship } from "@/hooks/useRelationship"
import { getDateFnsLocale } from "@/lib/i18n"
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
  const { t } = useTranslation(["profileSetting", "common"])
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
      title={t("avatar.title")}
      description={t("avatar.description")}
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title={t("avatar.drawerTitle")}
          description={t("avatar.drawerDescription")}
          onSubmit={handleSubmit}
          submitLabel={t("common:actions.save")}
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
              <span>{t("avatar.change")}</span>
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
  const { t } = useTranslation(["profileSetting", "common"])
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
      title={t("name.title")}
      description={t("name.description")}
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title={t("name.drawerTitle")}
          description={t("name.drawerDescription")}
          onSubmit={handleSubmit}
          submitLabel={t("common:actions.save")}
          isPending={isPending}
          submitDisabled={!trimmedName || !isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 max-w-[140px] rounded-xl px-2.5 text-xs font-medium"
            >
              <span className="truncate">{savedName || t("name.setName")}</span>
            </Button>
          }
        >
          <Input
            type="text"
            placeholder={t("name.placeholder")}
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
  const { t, i18n } = useTranslation("profileSetting")
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
            ? t("birthDate.birthdayToday")
            : days === 1
              ? t("birthDate.birthdayTomorrow")
              : t("birthDate.birthdayInDays", { count: days })
        return `${zodiac} · ${countdown}`
      })()
    : t("birthDate.setBirthday")

  return (
    <SettingRow
      icon={<CalendarIcon className="size-3.5" />}
      title={t("birthDate.title")}
      description={description}
      action={
        <CustomDatePicker
          variant="default"
          value={selectedDate}
          onChange={handleDateChange}
          minDate={new Date(1920, 0, 1)}
          maxDate={new Date()}
          title={t("birthDate.drawerTitle")}
          description={t("birthDate.drawerDescription")}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 rounded-xl px-2.5 text-xs font-medium"
            >
              {selectedDate
                ? format(selectedDate, "MMM d, yyyy", {
                    locale: getDateFnsLocale(i18n.language),
                  })
                : t("birthDate.setDate")}
            </Button>
          }
        />
      }
    />
  )
}

export function ProfileSettingScreen() {
  const { t } = useTranslation("profileSetting")
  const { currentMember, hasRelationship } = useRelationship()

  if (!hasRelationship || !currentMember) {
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-3 pb-20 sm:max-w-2xl">
      <CustomItem
        icon={<User className="size-3.5 text-primary" />}
        title={t("sectionTitle")}
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

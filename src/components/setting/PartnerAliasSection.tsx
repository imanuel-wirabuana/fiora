import { useState } from "react"
import { HeartHandshake, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRelationship } from "@/hooks/useRelationship"
import { SettingRow } from "./SettingRow"

export function PartnerAliasSection() {
  const { t } = useTranslation(["setting", "common"])
  const {
    relationship,
    partnerMember,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  const partnerUserId = partnerMember?.user_id
  const savedAlias =
    (partnerUserId && relationship?.content?.aliases?.[partnerUserId]) || ""

  const [open, setOpen] = useState(false)
  const [draftAlias, setDraftAlias] = useState(savedAlias)

  if (!hasRelationship || !relationship) {
    return null
  }

  if (!partnerMember) {
    return (
      <SettingRow
        icon={<HeartHandshake className="size-3.5" />}
        title={t("partnerAlias.title")}
        description={t("partnerAlias.waitingDescription")}
        action={
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <UserPlus className="size-3" /> {t("partnerAlias.waitingBadge")}
          </span>
        }
      />
    )
  }

  const isPending = updateRelationshipContentMutation.isPending
  const trimmedAlias = draftAlias.trim()
  const isChanged = trimmedAlias !== savedAlias
  const partnerName =
    partnerMember.content?.name || t("partnerAlias.yourPartner")

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftAlias(savedAlias)
    }
    setOpen(next)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!partnerUserId || !isChanged) {
      return false
    }

    const updatedAliases = {
      ...(relationship.content?.aliases || {}),
    }

    if (trimmedAlias) {
      updatedAliases[partnerUserId] = trimmedAlias
    } else {
      delete updatedAliases[partnerUserId]
    }

    try {
      await updateRelationshipContentMutation.mutateAsync({
        relationshipId: relationship.id,
        content: { aliases: updatedAliases },
      })
    } catch {
      return false
    }
  }

  return (
    <SettingRow
      icon={<HeartHandshake className="size-3.5" />}
      title={t("partnerAlias.title")}
      description={t("partnerAlias.description", { name: partnerName })}
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title={t("partnerAlias.title")}
          description={t("partnerAlias.drawerDescription", {
            name: partnerName,
          })}
          onSubmit={handleSubmit}
          submitLabel={t("common:actions.save")}
          isPending={isPending}
          submitDisabled={!isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 max-w-[140px] rounded-xl px-2.5 text-xs font-medium"
            >
              <span className="truncate">
                {savedAlias || t("partnerAlias.setAlias")}
              </span>
            </Button>
          }
        >
          <Input
            type="text"
            placeholder={t("partnerAlias.placeholder")}
            value={draftAlias}
            onChange={(e) => setDraftAlias(e.target.value)}
            maxLength={30}
            className="h-10 rounded-2xl px-3.5 text-xs"
          />
        </FormDrawer>
      }
    />
  )
}

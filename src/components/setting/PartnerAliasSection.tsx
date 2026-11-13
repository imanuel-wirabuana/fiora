import { useState } from "react"
import { HeartHandshake, UserPlus } from "lucide-react"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRelationship } from "@/hooks/useRelationship"
import { SettingRow } from "./SettingRow"

export function PartnerAliasSection() {
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
        title="Partner Alias"
        description="Set a special nickname for your partner once they join."
        action={
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <UserPlus className="size-3" /> Waiting Partner
          </span>
        }
      />
    )
  }

  const isPending = updateRelationshipContentMutation.isPending
  const trimmedAlias = draftAlias.trim()
  const isChanged = trimmedAlias !== savedAlias

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraftAlias(savedAlias)
    }
    setOpen(next)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!partnerUserId || !isChanged) {
      return false
    }

    const updatedAliases = {
      ...(relationship.content?.aliases || {}),
      [partnerUserId]: trimmedAlias,
    }

    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { aliases: updatedAliases },
    })
  }

  return (
    <SettingRow
      icon={<HeartHandshake className="size-3.5" />}
      title="Partner Alias"
      description={`Nickname for ${partnerMember.content?.name || "your partner"}.`}
      action={
        <FormDrawer
          open={open}
          onOpenChange={handleOpenChange}
          title="Partner Alias"
          description={`Give ${partnerMember.content?.name || "your partner"} a nickname visible to both of you.`}
          onSubmit={handleSubmit}
          submitLabel="Save"
          isPending={isPending}
          submitDisabled={!isChanged}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 max-w-[140px] rounded-xl px-2.5 text-xs font-medium"
            >
              <span className="truncate">{savedAlias || "Set alias"}</span>
            </Button>
          }
        >
          <Input
            type="text"
            placeholder="e.g. My Honey, Babe"
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

import { useState } from "react"
import { Check, HeartHandshake, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
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

  const [alias, setAlias] = useState(savedAlias)
  const [prevSavedAlias, setPrevSavedAlias] = useState(savedAlias)
  const [saved, setSaved] = useState(false)

  if (savedAlias !== prevSavedAlias) {
    setPrevSavedAlias(savedAlias)
    setAlias(savedAlias)
  }

  if (!hasRelationship || !relationship) {
    return null
  }

  const isPending = updateRelationshipContentMutation.isPending
  const isChanged = alias.trim() !== savedAlias

  const handleSaveAlias = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!partnerUserId) return
    const trimmed = alias.trim()

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    const updatedAliases = {
      ...(relationship.content?.aliases || {}),
      [partnerUserId]: trimmed,
    }

    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { aliases: updatedAliases },
    })
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

  return (
    <SettingRow
      icon={<HeartHandshake className="size-3.5" />}
      title="Partner Alias"
      description={`Give ${partnerMember.content?.name || "your partner"} a nickname visible to both of you.`}
    >
      <form onSubmit={handleSaveAlias} className="flex w-full items-center gap-2">
        <Input
          type="text"
          placeholder="e.g. My Honey, Babe"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          maxLength={30}
          className="h-8 flex-1 px-2.5 text-xs"
        />

        <Button
          type="submit"
          size="xs"
          disabled={!isChanged}
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
    </SettingRow>
  )
}

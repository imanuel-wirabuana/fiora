import { MapPin, ShieldCheck } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Switch } from "@/components/ui/switch"
import { useRelationship } from "@/hooks/useRelationship"

export function CommitmentSection() {
  const {
    relationship,
    locationSharing,
    hasRelationship,
    updateRelationshipContentMutation,
  } = useRelationship()

  if (!hasRelationship || !relationship) {
    return null
  }

  const handleToggleLocationSharing = (checked: boolean) => {
    updateRelationshipContentMutation.mutate({
      relationshipId: relationship.id,
      content: { location_sharing: checked },
    })
  }

  return (
    <CustomItem
      icon={<ShieldCheck className="size-3.5 text-primary" />}
      title="Commitment"
      contentClassName="space-y-2"
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-3.5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-foreground">
              Location Sharing
            </span>
            <p className="text-[11px] leading-tight text-muted-foreground">
              Share real-time location with your partner on the home screen.
            </p>
          </div>
        </div>

        <Switch
          checked={locationSharing}
          onCheckedChange={handleToggleLocationSharing}
          aria-label="Toggle location sharing"
        />
      </div>
    </CustomItem>
  )
}


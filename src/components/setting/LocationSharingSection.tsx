import { MapPin } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useRelationship } from "@/hooks/useRelationship"
import { SettingRow } from "./SettingRow"

export function LocationSharingSection() {
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
    <SettingRow
      icon={<MapPin className="size-3.5" />}
      title="Location Sharing"
      description="Share real-time location with your partner on the home screen."
      action={
        <Switch
          checked={locationSharing}
          onCheckedChange={handleToggleLocationSharing}
          aria-label="Toggle location sharing"
        />
      }
    />
  )
}

/** Backward compatibility alias */
export const CommitmentSection = LocationSharingSection

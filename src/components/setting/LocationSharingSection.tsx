import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { useRelationship } from "@/hooks/useRelationship"
import { SettingRow } from "./SettingRow"

export function LocationSharingSection() {
  const { t } = useTranslation("setting")
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
      title={t("locationSharing.title")}
      description={t("locationSharing.description")}
      action={
        <Switch
          checked={locationSharing}
          onCheckedChange={handleToggleLocationSharing}
          aria-label={t("locationSharing.ariaLabel")}
        />
      }
    />
  )
}

/** Backward compatibility alias */
export const CommitmentSection = LocationSharingSection

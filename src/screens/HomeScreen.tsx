import { lazy, Suspense } from "react"
import {
  DailyQuizSection,
  MoodSection,
  NudgeSection,
  PartnerPresenceSection,
} from "@/components/home"
import { useRelationship } from "@/hooks/useRelationship"

const LocationSharingSection = lazy(() =>
  import("@/components/home/LocationSharingSection").then((m) => ({
    default: m.LocationSharingSection,
  }))
)

export function HomeScreen() {
  const { locationSharing } = useRelationship()

  return (
    <section className="flex flex-col gap-4">
      <PartnerPresenceSection />
      <MoodSection />
      <NudgeSection />
      {locationSharing ? (
        <Suspense fallback={null}>
          <LocationSharingSection />
        </Suspense>
      ) : null}
      <DailyQuizSection />
    </section>
  )
}

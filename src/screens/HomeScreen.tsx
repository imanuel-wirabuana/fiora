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
      <div className="flex items-stretch gap-3">
        {locationSharing ? (
          <div className="flex min-w-0 flex-1">
            <Suspense fallback={null}>
              <LocationSharingSection />
            </Suspense>
          </div>
        ) : null}
        <div className={locationSharing ? "flex shrink-0" : "flex w-full"}>
          <NudgeSection compact={Boolean(locationSharing)} />
        </div>
      </div>
      <DailyQuizSection />
    </section>
  )
}

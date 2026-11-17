import { lazy, memo, Suspense } from "react"
import {
  DailyQuizSection,
  HoroscopeSection,
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

export const HomeScreen = memo(function HomeScreen() {
  const { locationSharing } = useRelationship()

  return (
    <div className="flex flex-col">
      <section className="bg-linear-to-b from-primary/90 via-primary/40 via-55% to-background pt-1 pb-32">
        <div className="mx-auto w-full max-w-md px-0.5 sm:max-w-2xl">
          <PartnerPresenceSection />
        </div>
      </section>
      <section className="relative z-10 mx-auto -mt-28 flex w-full max-w-md flex-col gap-4 px-4 sm:max-w-2xl">
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
      </section>
      <section className="pointer-events-none relative z-20 mx-auto mt-2 w-full max-w-md sm:max-w-2xl">
        <HoroscopeSection />
      </section>
      <section className="relative z-10 mx-auto mt-2 flex w-full max-w-md flex-col gap-4 px-4 pb-20 sm:max-w-2xl">
        <DailyQuizSection />
      </section>
    </div>
  )
})

import {
  DailyQuizSection,
  LocationSharingSection,
  MoodSection,
  NudgeSection,
  PartnerPresenceSection,
} from "@/components/home"

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4">
      <PartnerPresenceSection />
      <MoodSection />
      <NudgeSection />
      <DailyQuizSection />
      <LocationSharingSection />
    </section>
  )
}

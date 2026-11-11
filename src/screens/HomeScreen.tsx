import {
  DailyQuizSection,
  LocationSharingSection,
  MoodSection,
  NudgeSection,
} from "@/components/home"

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4">
      <MoodSection />
      <NudgeSection />
      <DailyQuizSection />
      <LocationSharingSection />
    </section>
  )
}

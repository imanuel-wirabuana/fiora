import {
  AccountSection,
  AnniversarySection,
  CommitmentSection,
  MoodsSection,
  NotificationSection,
  NudgesSection,
  ProfileSection,
  QuizSection,
  RelationshipSection,
} from "@/components/setting"

export function SettingScreen() {
  return (
    <section className="flex flex-col gap-3">
      <ProfileSection />
      <RelationshipSection />
      <NotificationSection />
      <AnniversarySection />
      <CommitmentSection />
      <QuizSection />
      <MoodsSection />
      <NudgesSection />
      <AccountSection />
    </section>
  )
}

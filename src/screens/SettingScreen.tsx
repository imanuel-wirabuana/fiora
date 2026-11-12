import {
  AccountSection,
  AnniversarySection,
  CommitmentSection,
  MoodsSection,
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
      <AnniversarySection />
      <CommitmentSection />
      <QuizSection />
      <MoodsSection />
      <NudgesSection />
      <AccountSection />
    </section>
  )
}

import {
  AccountSection,
  AnniversarySection,
  CommitmentSection,
  MoodsSection,
  NudgesSection,
  ProfileSection,
  RelationshipSection,
} from "@/components/setting"

export function SettingScreen() {
  return (
    <section className="flex flex-col gap-3">
      <ProfileSection />
      <RelationshipSection />
      <AnniversarySection />
      <CommitmentSection />
      <MoodsSection />
      <NudgesSection />
      <AccountSection />
    </section>
  )
}

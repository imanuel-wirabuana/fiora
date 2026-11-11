import {
  AccountSection,
  AnniversarySection,
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
      <MoodsSection />
      <NudgesSection />
      <AccountSection />
    </section>
  )
}

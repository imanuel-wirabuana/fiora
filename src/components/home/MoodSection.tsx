import { PartnerMood, YourMood } from "./CoupleMoodTracker"

export function MoodSection() {
  return (
    <div className="flex flex-row items-center justify-evenly gap-3">
      <YourMood />
      <PartnerMood />
    </div>
  )
}


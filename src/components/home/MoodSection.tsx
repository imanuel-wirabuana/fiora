import { PartnerMood, YourMood } from "./CoupleMoodTracker"

export function MoodSection() {
  return (
    <div className="grid min-h-32 grid-cols-2 gap-3">
      <YourMood />
      <PartnerMood />
    </div>
  )
}

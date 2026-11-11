import { PartnerMood, YourMood } from "@/components/home/CoupleMoodTracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4">
      {/* Mood tracker */}
      <div className="flex flex-row items-center justify-evenly gap-4">
        <YourMood />
        <PartnerMood />
      </div>

      {/* nudge */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nudge</CardTitle>
        </CardHeader>
        <CardContent>test</CardContent>
      </Card>

      {/* quiz */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Quiz</CardTitle>
        </CardHeader>
        <CardContent>test</CardContent>
      </Card>
    </section>
  )
}

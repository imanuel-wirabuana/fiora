import { PartnerMood, YourMood } from "@/components/home/CoupleMoodTracker"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4">
      {/* Mood tracker */}
      <div className="flex flex-row items-center justify-evenly gap-4">
        <YourMood />
        <PartnerMood />
      </div>

      {/* nudge */}
      <Item variant="outline" className="w-full flex-col items-start gap-2">
        <ItemHeader>
          <ItemTitle>Nudge</ItemTitle>
        </ItemHeader>
        <ItemContent>test</ItemContent>
      </Item>

      {/* quiz */}
      <Item variant="outline" className="w-full flex-col items-start gap-2">
        <ItemHeader>
          <ItemTitle>Daily Quiz</ItemTitle>
        </ItemHeader>
        <ItemContent>test</ItemContent>
      </Item>
    </section>
  )
}

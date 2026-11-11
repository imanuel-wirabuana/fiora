import { PartnerMood, YourMood } from "@/components/home/CoupleMoodTracker"
import { NudgeSection } from "@/components/home/NudgeSection"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"

export function HomeScreen() {
  return (
    <section className="flex flex-col gap-4">
      {/* Mood tracker */}
      <div className="flex flex-row items-center justify-evenly gap-3">
        <YourMood />
        <PartnerMood />
      </div>

      {/* Quick Nudge */}
      <NudgeSection />

      {/* Daily Quiz (Placeholder) */}
      <Item variant="outline" className="w-full flex-col items-start gap-2 p-3.5">
        <ItemHeader>
          <ItemTitle className="text-sm font-semibold">Daily Quiz</ItemTitle>
        </ItemHeader>
        <ItemContent className="text-xs text-muted-foreground">
          Coming soon in the next update!
        </ItemContent>
      </Item>
    </section>
  )
}

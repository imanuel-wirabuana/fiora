import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"

export function DailyQuizSection() {
  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2 p-3.5">
      <ItemHeader>
        <ItemTitle className="text-sm font-semibold">Daily Quiz</ItemTitle>
      </ItemHeader>
      <ItemContent className="text-xs text-muted-foreground">
        Coming soon in the next update!
      </ItemContent>
    </Item>
  )
}


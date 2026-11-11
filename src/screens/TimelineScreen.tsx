import { Item, ItemContent, ItemGroup, ItemHeader, ItemTitle } from "@/components/ui/item"

export function TimelineScreen() {
  return (
    <section className="flex flex-col gap-4">
      <Item variant="outline" className="w-full flex-col items-start gap-2">
        <ItemHeader>
          <ItemTitle>Calendar</ItemTitle>
        </ItemHeader>
        <ItemContent>test</ItemContent>
      </Item>

      <span className="text-xs font-medium text-muted-foreground">Filters</span>

      <ItemGroup>
        {[1, 2, 3, 4, 5].map((number) => (
          <Item key={number} variant="outline" className="w-full flex-col items-start gap-2">
            <ItemHeader>
              <ItemTitle>Mood {number}</ItemTitle>
            </ItemHeader>
          </Item>
        ))}
      </ItemGroup>
    </section>
  )
}

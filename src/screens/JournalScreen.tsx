import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"

export function JournalScreen() {
  return (
    <section className="flex flex-col gap-4">
      <span className="text-xs font-medium text-muted-foreground">Search</span>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
          <Item key={number} variant="outline" className="w-full flex-col items-start gap-2">
            <ItemHeader>
              <ItemTitle>Journal {number}</ItemTitle>
            </ItemHeader>
            <ItemContent></ItemContent>
          </Item>
        ))}
      </div>
    </section>
  )
}

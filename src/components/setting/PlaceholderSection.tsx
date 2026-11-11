import {
  Item,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"

export function PlaceholderSection() {
  return (
    <ItemGroup>
      {[1, 2].map((number) => (
        <Item
          key={number}
          variant="outline"
          className="w-full flex-col items-start gap-2"
        >
          <ItemHeader>
            <ItemTitle>Settings section {number}</ItemTitle>
          </ItemHeader>
        </Item>
      ))}
    </ItemGroup>
  )
}


import { Item, ItemContent, ItemHeader, ItemTitle } from "../ui/item"

function YourMood() {
  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2">
      <ItemHeader>
        <ItemTitle>You</ItemTitle>
      </ItemHeader>
      <ItemContent>test</ItemContent>
    </Item>
  )
}

function PartnerMood() {
  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2">
      <ItemHeader>
        <ItemTitle>Partner</ItemTitle>
      </ItemHeader>
      <ItemContent>test</ItemContent>
    </Item>
  )
}

export { YourMood, PartnerMood }

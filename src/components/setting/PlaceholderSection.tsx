import { Settings } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { ItemGroup } from "@/components/ui/item"

export function PlaceholderSection() {
  return (
    <ItemGroup>
      {[1, 2].map((number) => (
        <CustomItem
          key={number}
          icon={<Settings className="size-3.5 text-muted-foreground" />}
          title={`Settings section ${number}`}
          className="gap-2"
        />
      ))}
    </ItemGroup>
  )
}


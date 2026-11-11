import { formatDistanceToNow } from "date-fns"
import { Heart, Smile } from "lucide-react"
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "../ui/item"
import { useActivities } from "../../hooks/useActivities"
import { useRelationship } from "../../hooks/useRelationship"

function YourMood() {
  const { myLatestMood, isLoading } = useActivities()
  const { currentMember } = useRelationship()

  const moodContent = myLatestMood?.content

  return (
    <Item variant="outline" className="w-full flex-1 flex-col items-start gap-2 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{currentMember?.content?.avatar || "🙋"}</span>
          <ItemTitle className="text-xs font-semibold">You</ItemTitle>
        </div>
        {myLatestMood ? (
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(myLatestMood.created_at), { addSuffix: true })}
          </span>
        ) : null}
      </ItemHeader>

      <ItemContent className="w-full space-y-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : moodContent ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodContent.emoji}</span>
              <span className="font-semibold text-sm">{moodContent.label}</span>
            </div>
            {moodContent.note ? (
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                "{moodContent.note}"
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
            <Smile className="size-4 shrink-0" />
            <ItemDescription className="text-xs">Tap + below to log mood</ItemDescription>
          </div>
        )}
      </ItemContent>
    </Item>
  )
}

function PartnerMood() {
  const { partnerLatestMood, isLoading } = useActivities()
  const { partnerMember } = useRelationship()

  const moodContent = partnerLatestMood?.content
  const partnerName = partnerMember?.content?.name || "Partner"

  return (
    <Item variant="outline" className="w-full flex-1 flex-col items-start gap-2 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{partnerMember?.content?.avatar || "🤍"}</span>
          <ItemTitle className="text-xs font-semibold truncate capitalize">
            {partnerName}
          </ItemTitle>
        </div>
        {partnerLatestMood ? (
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(partnerLatestMood.created_at), { addSuffix: true })}
          </span>
        ) : null}
      </ItemHeader>

      <ItemContent className="w-full space-y-1">
        {!partnerMember ? (
          <ItemDescription className="text-xs py-1 text-muted-foreground">
            Waiting for partner to join
          </ItemDescription>
        ) : isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : moodContent ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodContent.emoji}</span>
              <span className="font-semibold text-sm">{moodContent.label}</span>
            </div>
            {moodContent.note ? (
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                "{moodContent.note}"
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
            <Heart className="size-4 shrink-0 text-muted-foreground/60" />
            <ItemDescription className="text-xs">No mood logged yet</ItemDescription>
          </div>
        )}
      </ItemContent>
    </Item>
  )
}

export { YourMood, PartnerMood }

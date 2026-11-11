import { formatDistanceToNow } from "date-fns"
import { Heart, Smile, UserPlus } from "lucide-react"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "../ui/item"
import { cn } from "../../lib/utils"
import { useActivities } from "../../hooks/useActivities"
import { useRelationship } from "../../hooks/useRelationship"
import type { Gender } from "../../types/relationship"

function getGenderRingStyles(gender?: Gender | null) {
  if (gender === "male") {
    return {
      card: "border-blue-500/30 ring-1 ring-blue-500/20",
      circle:
        "bg-blue-500/10 ring-2 ring-blue-500/50 text-blue-600 dark:bg-blue-400/10 dark:ring-blue-400/50 dark:text-blue-400",
    }
  }
  if (gender === "female") {
    return {
      card: "border-rose-500/30 ring-1 ring-rose-500/20",
      circle:
        "bg-rose-500/10 ring-2 ring-rose-500/50 text-rose-600 dark:bg-rose-400/10 dark:ring-rose-400/50 dark:text-rose-400",
    }
  }
  return {
    card: "border-border",
    circle: "bg-muted/40 ring-1 ring-border text-muted-foreground",
  }
}

function YourMood() {
  const { myLatestMood, isLoading } = useActivities()
  const { currentMember } = useRelationship()

  const moodContent = myLatestMood?.content
  const gender = currentMember?.content?.gender
  const styles = getGenderRingStyles(gender)

  return (
    <Item
      variant="outline"
      className={cn(
        "h-full w-full flex-col flex-nowrap items-center justify-between gap-3 p-3.5 text-center",
        styles.card
      )}
    >
      {/* Top Header */}
      <ItemHeader className="w-full basis-auto items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-sm leading-none">
            {currentMember?.content?.avatar || "🙋"}
          </span>
          <ItemTitle className="truncate text-xs font-semibold">You</ItemTitle>
        </div>
        {myLatestMood ? (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(myLatestMood.created_at), {
              addSuffix: true,
            })}
          </span>
        ) : null}
      </ItemHeader>

      {/* Centered Big Icon & Mood Status */}
      <ItemContent className="w-full flex-none items-center justify-center gap-2 py-0.5">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full transition-transform",
            styles.circle
          )}
        >
          {moodContent ? (
            <span className="text-3xl leading-none select-none">
              {moodContent.emoji}
            </span>
          ) : (
            <Smile className="size-6 opacity-75" />
          )}
        </div>

        {isLoading ? (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        ) : moodContent ? (
          <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
            <span className="w-full truncate text-sm font-semibold text-foreground">
              {moodContent.label}
            </span>
            {moodContent.note ? (
              <p className="line-clamp-1 w-full text-center text-[11px] text-muted-foreground italic">
                "{moodContent.note}"
              </p>
            ) : (
              <span className="text-[11px] text-muted-foreground/70">
                Checked in
              </span>
            )}
          </div>
        ) : (
          <ItemDescription className="text-center text-xs">
            Tap + to log mood
          </ItemDescription>
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
  const gender = partnerMember?.content?.gender
  const styles = getGenderRingStyles(gender)

  return (
    <Item
      variant="outline"
      className={cn(
        "h-full w-full flex-col flex-nowrap items-center justify-between gap-3 p-3.5 text-center",
        styles.card
      )}
    >
      {/* Top Header */}
      <ItemHeader className="w-full basis-auto items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-sm leading-none">
            {partnerMember?.content?.avatar || "🤍"}
          </span>
          <ItemTitle className="truncate text-xs font-semibold capitalize">
            {partnerName}
          </ItemTitle>
        </div>
        {partnerLatestMood ? (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(partnerLatestMood.created_at), {
              addSuffix: true,
            })}
          </span>
        ) : null}
      </ItemHeader>

      {/* Centered Big Icon & Mood Status */}
      <ItemContent className="w-full flex-none items-center justify-center gap-2 py-0.5">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full transition-transform",
            styles.circle
          )}
        >
          {!partnerMember ? (
            <UserPlus className="size-6 opacity-60" />
          ) : moodContent ? (
            <span className="text-3xl leading-none select-none">
              {moodContent.emoji}
            </span>
          ) : (
            <Heart className="size-6 opacity-75" />
          )}
        </div>

        {!partnerMember ? (
          <ItemDescription className="text-center text-xs">
            Waiting for partner
          </ItemDescription>
        ) : isLoading ? (
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        ) : moodContent ? (
          <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
            <span className="w-full truncate text-sm font-semibold text-foreground">
              {moodContent.label}
            </span>
            {moodContent.note ? (
              <p className="line-clamp-1 w-full text-center text-[11px] text-muted-foreground italic">
                "{moodContent.note}"
              </p>
            ) : (
              <span className="text-[11px] text-muted-foreground/70">
                Checked in
              </span>
            )}
          </div>
        ) : (
          <ItemDescription className="text-center text-xs">
            No mood logged yet
          </ItemDescription>
        )}
      </ItemContent>
    </Item>
  )
}

export { YourMood, PartnerMood }

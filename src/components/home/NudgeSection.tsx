import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Send } from "lucide-react"
import { Button } from "../ui/button"
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from "../ui/item"
import { useActivities } from "../../hooks/useActivities"
import { useRelationship } from "../../hooks/useRelationship"
import { useAuth } from "../../hooks/useAuth"
import type { NudgeOption } from "../../types/relationship"

export function NudgeSection() {
  const { nudgeOptions, partnerMember } = useRelationship()
  const { latestNudge, sendNudge } = useActivities()
  const { user } = useAuth()
  const [justSentLabel, setJustSentLabel] = useState<string | null>(null)

  const partnerName = partnerMember?.content?.name || "Partner"

  const handleSendNudge = (nudge: NudgeOption) => {
    if (!partnerMember) return
    setJustSentLabel(nudge.label)
    sendNudge({
      emoji: nudge.emoji,
      label: nudge.label,
    }).catch(() => {
      // Handled by TanStack Query rollback
    })

    setTimeout(() => {
      setJustSentLabel(null)
    }, 1200)
  }

  const isSentByMe = latestNudge?.user_id === user?.id

  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2.5 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <ItemTitle className="text-sm font-semibold">Quick Nudge</ItemTitle>
        </div>
        {latestNudge ? (
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(latestNudge.created_at), { addSuffix: true })}
          </span>
        ) : null}
      </ItemHeader>

      <ItemContent className="w-full space-y-2.5">
        {/* Latest Nudge Status Preview */}
        {latestNudge && latestNudge.content ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs">
            <span className="text-base">{latestNudge.content.emoji}</span>
            <div className="flex-1 truncate">
              <span className="font-medium text-foreground">
                {isSentByMe ? "You sent: " : `${partnerName} sent: `}
              </span>
              <span className="text-muted-foreground">
                "{latestNudge.content.label}"
              </span>
            </div>
          </div>
        ) : (
          <ItemDescription className="text-xs text-muted-foreground">
            Send a quick one-tap nudge to let {partnerName} know you're thinking of them.
          </ItemDescription>
        )}

        {/* Nudge Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {nudgeOptions.map((nudge, idx) => {
            const isJustSent = justSentLabel === nudge.label
            return (
              <Button
                key={`${nudge.label}-${idx}`}
                type="button"
                variant="outline"
                size="sm"
                disabled={!partnerMember}
                onClick={() => handleSendNudge(nudge)}
                className="h-9 justify-start gap-2 px-2.5 text-xs font-normal transition active:scale-95"
              >
                <span className="shrink-0 text-base">{nudge.emoji}</span>
                <span className="truncate flex-1 text-left">
                  {isJustSent ? "Sent! 💌" : nudge.label}
                </span>
                <Send className="size-3 shrink-0 opacity-40" />
              </Button>
            )
          })}
        </div>

        {!partnerMember && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Connect with a partner first to send nudges.
          </p>
        )}
      </ItemContent>
    </Item>
  )
}


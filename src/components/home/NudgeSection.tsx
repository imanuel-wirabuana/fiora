import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Pin, Send } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { useActivities } from "@/hooks/useActivities"
import { useRelationship } from "@/hooks/useRelationship"
import { useAuth } from "@/hooks/useAuth"
import type { NudgeOption } from "@/types/relationship"

export function NudgeSection() {
  const { nudgeOptions, partnerMember } = useRelationship()
  const { latestNudge, sendNudge } = useActivities()
  const { user } = useAuth()
  const [justSentLabel, setJustSentLabel] = useState<string | null>(null)

  const partnerName = partnerMember?.content?.name || "Partner"

  const orderedNudges = useMemo(() => {
    const pinned = nudgeOptions.filter((n) => n.pinned)
    const unpinned = nudgeOptions.filter((n) => !n.pinned)
    return [...pinned, ...unpinned]
  }, [nudgeOptions])

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
    <CustomItem
      variant="soft"
      icon={<Send className="size-3.5 text-primary" />}
      title="Quick Nudge"
      topRightActions={
        latestNudge ? (
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(latestNudge.created_at), {
              addSuffix: true,
            })}
          </span>
        ) : null
      }

      contentClassName="space-y-2.5"
      bottomLeftInfo={
        !partnerMember ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            Connect with a partner first to send nudges.
          </p>
        ) : null
      }
    >
      {/* Latest Nudge Status Preview */}
      {latestNudge && latestNudge.content && (
        <div className="flex w-full items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-[11px]">
          <AnimatedEmoji
            emoji={latestNudge.content.emoji}
            size={18}
            replayOnTap={false}
            className="shrink-0"
            fallbackClassName="text-sm"
          />
          <div className="flex-1 truncate">
            <span className="font-medium text-foreground">
              {isSentByMe ? "You sent: " : `${partnerName} sent: `}
            </span>
            <span className="text-muted-foreground">
              "{latestNudge.content.label}"
            </span>
          </div>
        </div>
      )}

      {/* Nudge Buttons */}
      <div className="grid w-full grid-cols-2 gap-2">
        {orderedNudges.map((nudge, idx) => {
          const isJustSent = justSentLabel === nudge.label
          return (
            <Button
              key={`${nudge.label}-${idx}`}
              type="button"
              variant="outline"
              size="sm"
              disabled={!partnerMember}
              onClick={() => handleSendNudge(nudge)}
              className="h-9 justify-start gap-2 px-2.5 text-[11px] font-normal transition active:scale-95"
            >
              <AnimatedEmoji
                emoji={nudge.emoji}
                size={18}
                replayOnTap={false}
                className="shrink-0"
                fallbackClassName="text-sm"
              />
              <span className="flex-1 truncate text-left">
                {isJustSent ? "Sent! 💌" : nudge.label}
              </span>
              {nudge.pinned ? (
                <Pin className="size-3 shrink-0 text-primary/70" />
              ) : (
                <Send className="size-3 shrink-0 opacity-40" />
              )}
            </Button>
          )
        })}
      </div>
    </CustomItem>
  )
}

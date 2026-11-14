import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Check, Plus, Send } from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomItem } from "@/components/CustomItem"
import { FormDrawer } from "@/components/FormDrawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActivities } from "@/hooks/useActivities"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
import type { NudgeOption } from "@/types/relationship"

const DEFAULT_CUSTOM_NUDGE_EMOJI = "💌"
const NUDGE_COOLDOWN_MS = 10_000
const CUSTOM_NUDGE_KEY = "__custom__"
const getNow = () => Date.now()
const getNudgeKey = (emoji: string, label: string) => `${emoji}::${label}`

interface NudgeSectionProps {
  compact?: boolean
}

interface LocalSentNudge {
  at: number
  emoji: string
  label: string
}

export function NudgeSection({ compact = false }: NudgeSectionProps) {
  const { nudgeOptions, partnerMember } = useRelationship()
  const { nudgeActivities, latestNudge, sendNudge } = useActivities()
  const { user } = useAuth()
  const [justSentLabel, setJustSentLabel] = useState<string | null>(null)
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customEmoji, setCustomEmoji] = useState(DEFAULT_CUSTOM_NUDGE_EMOJI)
  const [customLabel, setCustomLabel] = useState("")
  const [isSendingCustom, setIsSendingCustom] = useState(false)
  const [localLastSent, setLocalLastSent] = useState<LocalSentNudge | null>(
    null
  )
  const [localSentByKey, setLocalSentByKey] = useState<Record<string, number>>(
    {}
  )
  const [now, setNow] = useState<number>(getNow)

  const partnerName = partnerMember?.content?.name || "Partner"

  const pinnedNudges = useMemo(
    () => nudgeOptions.filter((n) => n.pinned),
    [nudgeOptions]
  )

  const pinnedKeySet = useMemo(
    () => new Set(pinnedNudges.map((n) => getNudgeKey(n.emoji, n.label))),
    [pinnedNudges]
  )

  const myLastServerNudge = useMemo(
    () => nudgeActivities.find((a) => a.user_id === user?.id) ?? null,
    [nudgeActivities, user?.id]
  )

  const myLastNudge = useMemo(() => {
    const serverAt = myLastServerNudge
      ? new Date(myLastServerNudge.created_at).getTime()
      : 0
    const localAt = localLastSent?.at ?? 0

    if (localLastSent && localAt >= serverAt) {
      return {
        at: localAt,
        emoji: localLastSent.emoji,
        label: localLastSent.label,
      }
    }

    if (myLastServerNudge?.content) {
      return {
        at: serverAt,
        emoji: myLastServerNudge.content.emoji,
        label: myLastServerNudge.content.label,
      }
    }

    return null
  }, [myLastServerNudge, localLastSent])

  const lastSentByKey = useMemo(() => {
    const map: Record<string, number> = { ...localSentByKey }

    for (const activity of nudgeActivities) {
      if (activity.user_id !== user?.id || !activity.content) continue
      const ts = new Date(activity.created_at).getTime()
      const key = getNudgeKey(activity.content.emoji, activity.content.label)
      const targetKey = pinnedKeySet.has(key) ? key : CUSTOM_NUDGE_KEY
      map[targetKey] = Math.max(map[targetKey] ?? 0, ts)
    }

    return map
  }, [nudgeActivities, user?.id, pinnedKeySet, localSentByKey])

  const getCooldownSeconds = (key: string) => {
    const lastAt = lastSentByKey[key] ?? 0
    const remainingMs = Math.max(0, lastAt + NUDGE_COOLDOWN_MS - now)
    return Math.ceil(remainingMs / 1000)
  }

  const hasAnyCooldown = useMemo(
    () =>
      Object.values(lastSentByKey).some(
        (ts) => ts + NUDGE_COOLDOWN_MS > now
      ),
    [lastSentByKey, now]
  )

  const customCooldownSeconds = getCooldownSeconds(CUSTOM_NUDGE_KEY)
  const isLatestMyNudgeCustom = useMemo(() => {
    if (!myLastNudge || !myLastNudge.label) return false
    return !pinnedKeySet.has(getNudgeKey(myLastNudge.emoji, myLastNudge.label))
  }, [myLastNudge, pinnedKeySet])

  useEffect(() => {
    if (!hasAnyCooldown) return

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [hasAnyCooldown])

  const handleSendNudge = (nudge: NudgeOption) => {
    const key = getNudgeKey(nudge.emoji, nudge.label)
    if (!partnerMember || getCooldownSeconds(key) > 0) return

    const sentAt = getNow()
    setLocalLastSent({ at: sentAt, emoji: nudge.emoji, label: nudge.label })
    setLocalSentByKey((prev) => ({ ...prev, [key]: sentAt }))
    setNow(sentAt)
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

  const handleCustomSubmit = async () => {
    const trimmedLabel = customLabel.trim()
    if (!partnerMember || customCooldownSeconds > 0 || !trimmedLabel) {
      return false
    }

    const emoji = customEmoji.trim() || DEFAULT_CUSTOM_NUDGE_EMOJI
    setIsSendingCustom(true)
    try {
      await sendNudge({
        emoji,
        label: trimmedLabel,
      })
      const sentAt = getNow()
      setLocalLastSent({ at: sentAt, emoji, label: trimmedLabel })
      setLocalSentByKey((prev) => ({ ...prev, [CUSTOM_NUDGE_KEY]: sentAt }))
      setNow(sentAt)
      setCustomLabel("")
      setCustomEmoji(DEFAULT_CUSTOM_NUDGE_EMOJI)
      return true
    } catch {
      return false
    } finally {
      setIsSendingCustom(false)
    }
  }

  const isSentByMe = latestNudge?.user_id === user?.id

  return (
    <>
      <CustomItem
        variant="soft"
        icon={<Send className="size-3.5 text-primary" />}
        title="Quick Nudge"
        contentHorizontalAlign={compact ? "center" : "start"}
        className={cn(
          "h-full",
          compact && "w-14 shrink-0 items-center gap-0 p-2"
        )}
        headerClassName={cn(compact && "hidden")}
        topRightActions={
          !compact && latestNudge ? (
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(latestNudge.created_at), {
                addSuffix: true,
              })}
            </span>
          ) : null
        }
        contentClassName={cn(
          "flex-1",
          compact ? "flex h-full flex-col items-center" : "space-y-2"
        )}
        bottomLeftInfo={
          !compact && !partnerMember ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              Connect with a partner first to send nudges.
            </p>
          ) : null
        }
      >
        {/* Latest Nudge Status Preview */}
        {!compact && latestNudge && latestNudge.content && (
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

        {/* Pinned Nudge Buttons + Custom Nudge Trigger */}
        <div
          className={cn(
            "w-full",
            compact
              ? "flex h-full flex-1 flex-col items-center justify-between gap-1.5"
              : "grid grid-cols-2 gap-2"
          )}
        >
          {pinnedNudges.map((nudge, idx) => {
            const key = getNudgeKey(nudge.emoji, nudge.label)
            const cooldownSeconds = getCooldownSeconds(key)
            const isOnCooldown = cooldownSeconds > 0
            const isJustSent = justSentLabel === nudge.label
            const isLatestSent =
              myLastNudge?.label === nudge.label &&
              myLastNudge?.emoji === nudge.emoji
            return (
              <Button
                key={`${nudge.label}-${idx}`}
                type="button"
                variant="outline"
                size="sm"
                disabled={!partnerMember || isOnCooldown}
                onClick={() => handleSendNudge(nudge)}
                title={
                  isOnCooldown
                    ? `Wait ${cooldownSeconds}s before sending "${nudge.label}" again`
                    : nudge.label
                }
                aria-label={nudge.label}
                className={cn(
                  "relative font-normal transition active:scale-95",
                  compact
                    ? "size-9 justify-center rounded-full p-0"
                    : "h-9 justify-start gap-2 px-2.5 text-[11px]",
                  isLatestSent &&
                    "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                {compact && isJustSent && !isOnCooldown ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <AnimatedEmoji
                    emoji={nudge.emoji}
                    size={18}
                    replayOnTap={false}
                    className="shrink-0"
                    fallbackClassName="text-sm"
                  />
                )}
                {!compact && (
                  <span className="flex-1 truncate text-left">
                    {isJustSent ? "Sent!" : nudge.label}
                  </span>
                )}
                {isOnCooldown && (
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-background/80 text-[11px] font-semibold text-primary tabular-nums backdrop-blur-[1px]",
                      compact ? "rounded-full" : "rounded-md"
                    )}
                  >
                    {cooldownSeconds}s
                  </span>
                )}
              </Button>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!partnerMember || customCooldownSeconds > 0}
            onClick={() => setIsCustomOpen(true)}
            title={
              customCooldownSeconds > 0
                ? `Wait ${customCooldownSeconds}s before sending another custom nudge`
                : "Send custom nudge"
            }
            aria-label="Send custom nudge"
            className={cn(
              "relative border-dashed font-normal text-muted-foreground transition hover:text-foreground active:scale-95",
              compact
                ? "size-9 justify-center rounded-full p-0"
                : "h-9 justify-start gap-2 px-2.5 text-[11px]",
              isLatestMyNudgeCustom &&
                "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}
          >
            <Plus className="size-4 shrink-0" />
            {!compact && (
              <span className="flex-1 truncate text-left">Custom</span>
            )}
            {customCooldownSeconds > 0 && (
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-background/80 text-[11px] font-semibold text-primary tabular-nums backdrop-blur-[1px]",
                  compact ? "rounded-full" : "rounded-md"
                )}
              >
                {customCooldownSeconds}s
              </span>
            )}
          </Button>
        </div>
      </CustomItem>

      <FormDrawer
        open={isCustomOpen}
        onOpenChange={(open) => {
          setIsCustomOpen(open)
          if (!open) {
            setCustomLabel("")
            setCustomEmoji(DEFAULT_CUSTOM_NUDGE_EMOJI)
          }
        }}
        title="Send Custom Nudge"
        description={`Send a quick nudge to ${partnerName}.`}
        submitLabel={
          customCooldownSeconds > 0
            ? `Wait ${customCooldownSeconds}s`
            : "Send Nudge"
        }
        successLabel="Sent!"
        isPending={isSendingCustom}
        submitDisabled={
          !partnerMember || customCooldownSeconds > 0 || !customLabel.trim()
        }
        onSubmit={handleCustomSubmit}
      >
        <div className="space-y-3 py-2">
          <div className="flex items-end gap-2.5">
            <div className="w-20 space-y-1.5">
              <Label htmlFor="custom-nudge-emoji" className="text-xs">
                Icon
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="custom-nudge-emoji"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder={DEFAULT_CUSTOM_NUDGE_EMOJI}
                  maxLength={4}
                  className="h-9 text-center text-base"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <Label htmlFor="custom-nudge-label" className="text-xs">
                Message
              </Label>
              <Input
                id="custom-nudge-label"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Thinking of you..."
                maxLength={48}
                autoFocus
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </FormDrawer>
    </>
  )
}

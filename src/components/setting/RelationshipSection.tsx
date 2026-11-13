import { Check, Copy, Heart, RefreshCw, UserCheck, UserPlus } from "lucide-react"
import { useState } from "react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useRelationship } from "@/hooks/useRelationship"

export function RelationshipSection() {
  const {
    relationship,
    currentMember,
    partnerMember,
    hasRelationship,
    regenerateInviteCodeMutation,
  } = useRelationship()

  const [copied, setCopied] = useState(false)

  if (!hasRelationship || !relationship) {
    return null
  }

  const hasPartner = Boolean(partnerMember)

  const handleCopyCode = async () => {
    if (!relationship.invite_code) return
    try {
      await navigator.clipboard.writeText(relationship.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleRegenerateCode = () => {
    regenerateInviteCodeMutation.mutate(relationship.id)
  }

  return (
    <CustomItem
      variant="default"
      icon={<Heart className="size-3.5 text-primary" />}
      title="Relationship"
      topRightActions={
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            hasPartner
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {hasPartner ? (
            <>
              <UserCheck className="size-3" /> Connected
            </>
          ) : (
            <>
              <UserPlus className="size-3" /> Waiting Partner
            </>
          )}
        </span>
      }
      contentClassName="space-y-2"
    >
      {/* Compact Members Status Row */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-xs">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            You
          </span>
          <p className="truncate font-medium text-foreground capitalize">
            {currentMember?.content?.name || "Member"}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Partner
          </span>
          <p className="truncate font-medium text-foreground capitalize">
            {hasPartner
              ? partnerMember?.content?.name || "Connected"
              : "None"}
          </p>
        </div>
      </div>

      {/* Invite Code: Only shown when no partner exists */}
      {!hasPartner && (
        <div className="space-y-1.5 rounded-xl border border-dashed border-border bg-muted/30 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Invite Code
            </span>
            {relationship.invite_code && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRegenerateCode}
                  disabled={regenerateInviteCodeMutation.isPending}
                  title="Regenerate invite code"
                  className="h-6 w-6 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {regenerateInviteCodeMutation.isPending ? (
                    <Spinner className="size-3" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleCopyCode}
                  className="h-6 gap-1 px-2 text-[11px]"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {relationship.invite_code ? (
            <p className="font-mono text-sm font-bold tracking-widest text-foreground">
              {relationship.invite_code}
            </p>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                No active code
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleRegenerateCode}
                disabled={regenerateInviteCodeMutation.isPending}
                className="h-6 gap-1 px-2 text-[11px]"
              >
                {regenerateInviteCodeMutation.isPending ? (
                  <Spinner className="size-3" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                Generate Code
              </Button>
            </div>
          )}
        </div>
      )}
    </CustomItem>
  )
}

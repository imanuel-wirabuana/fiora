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
      variant="fill"
      icon={<Heart className="size-3.5 text-primary-foreground" />}
      title="Relationship"
      topRightActions={
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            hasPartner
              ? "border-emerald-300/30 bg-emerald-400/25 text-white"
              : "border-amber-300/30 bg-amber-400/25 text-white"
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
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-2.5 text-xs">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-primary-foreground/75 uppercase">
            You
          </span>
          <p className="truncate font-medium text-primary-foreground capitalize">
            {currentMember?.content?.name || "Member"}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-primary-foreground/75 uppercase">
            Partner
          </span>
          <p className="truncate font-medium text-primary-foreground capitalize">
            {hasPartner
              ? partnerMember?.content?.name || "Connected"
              : "None"}
          </p>
        </div>
      </div>

      {/* Invite Code: Only shown when no partner exists */}
      {!hasPartner && (
        <div className="space-y-1.5 rounded-xl border border-dashed border-primary-foreground/35 bg-primary-foreground/10 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-primary-foreground/80">
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
                  className="h-6 w-6 text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
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
                  className="h-6 gap-1 border-primary-foreground/30 bg-primary-foreground/15 px-2 text-[11px] text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-300" /> Copied
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
            <p className="font-mono text-base font-bold tracking-widest text-primary-foreground">
              {relationship.invite_code}
            </p>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-primary-foreground/80">
                No active code
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleRegenerateCode}
                disabled={regenerateInviteCodeMutation.isPending}
                className="h-6 gap-1 border-primary-foreground/30 bg-primary-foreground/15 px-2 text-[11px] text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground"
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

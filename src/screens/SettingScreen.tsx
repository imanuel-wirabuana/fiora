import { Copy, HeartHandshake, UserCheck, Users } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useRelationship } from "@/hooks/useRelationship"

export function SettingScreen() {
  const { user, signOutMutation } = useAuth()
  const { relationship, currentMember, partnerMember, hasRelationship } = useRelationship()
  const [copied, setCopied] = useState(false)

  const handleSignOut = () => {
    signOutMutation.mutate()
  }

  const handleCopyCode = async () => {
    if (!relationship?.invite_code) return
    try {
      await navigator.clipboard.writeText(relationship.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Account Profile Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {user?.email ? `Signed in as ${user.email}` : "Signed in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={signOutMutation.isPending}
            className="w-full rounded-2xl sm:w-auto text-xs"
          >
            {signOutMutation.isPending ? <Spinner className="size-4" /> : "Sign Out"}
          </Button>
        </CardContent>
      </Card>

      {/* Relationship Info Card */}
      {hasRelationship && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartHandshake className="size-5 text-primary" />
              <CardTitle>Relationship Space</CardTitle>
            </div>
            <CardDescription>
              {partnerMember ? "Connected with your partner" : "Waiting for partner to join"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-medium text-muted-foreground">Your Profile</span>
                <p className="font-semibold capitalize">
                  {currentMember?.content?.gender || "Not set"}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <span className="font-medium text-muted-foreground">Partner Status</span>
                <p className="flex items-center gap-1 font-semibold text-primary">
                  {partnerMember ? (
                    <>
                      <UserCheck className="size-3.5 text-emerald-600" />
                      Connected ({partnerMember.content?.gender || "Partner"})
                    </>
                  ) : (
                    <>
                      <Users className="size-3.5 text-muted-foreground" />
                      Pending Partner
                    </>
                  )}
                </p>
              </div>
            </div>

            {relationship?.invite_code && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Invite Code
                  </span>
                  <p className="font-mono text-base font-bold tracking-wider text-primary">
                    {relationship.invite_code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="rounded-xl text-xs gap-1"
                >
                  <Copy className="size-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {[1, 2].map((number) => (
        <Card key={number} className="w-full">
          <CardHeader>
            <CardTitle>Settings section {number}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}

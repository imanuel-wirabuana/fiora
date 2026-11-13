import { useState } from "react"
import { Check, Copy, RefreshCw, UserPlus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InviteCodeStepProps {
  inviteCode: string
  onRegenerateCode: () => void
  partnerCode: string
  onChangePartnerCode: (code: string) => void
  tab: "create" | "join"
  onChangeTab: (tab: "create" | "join") => void
  error?: string | null
}

export function InviteCodeStep({
  inviteCode,
  onRegenerateCode,
  partnerCode,
  onChangePartnerCode,
  tab,
  onChangeTab,
  error,
}: InviteCodeStepProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">Connect with Partner</h3>
        <p className="text-xs text-muted-foreground">
          Share your 5-digit code with your partner or enter their code to link accounts
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(val) => onChangeTab(val as "create" | "join")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/60 p-1">
          <TabsTrigger value="create" className="text-xs font-semibold rounded-xl">
            <Users className="size-3.5 mr-1.5" />
            My Code
          </TabsTrigger>
          <TabsTrigger value="join" className="text-xs font-semibold rounded-xl">
            <UserPlus className="size-3.5 mr-1.5" />
            Join Partner
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Generate & Share Invite Code */}
        <TabsContent value="create" className="space-y-4 pt-3 outline-none">
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-muted/20 p-6 text-center">
            <span className="text-xs font-medium text-muted-foreground">
              Your 5-Digit Invite Code
            </span>
            <div className="flex items-center gap-1.5 font-mono text-3xl font-extrabold tracking-widest text-primary">
              {inviteCode.split("").map((digit, i) => (
                <span
                  key={i}
                  className="flex size-11 items-center justify-center rounded-2xl border border-input bg-background shadow-xs"
                >
                  {digit}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-2xl text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy Code
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRegenerateCode}
                className="rounded-2xl text-xs gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="size-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Give this code to your partner so they can join your relationship. You can always see it in Settings.
          </p>
        </TabsContent>

        {/* Tab 2: Join Partner's Code */}
        <TabsContent value="join" className="space-y-4 pt-3 outline-none">
          <Field className="gap-2 items-center text-center" data-invalid={!!error}>
            <FieldLabel className="text-xs font-medium text-muted-foreground">
              Enter Partner's 5-Digit Code
            </FieldLabel>
            <div className="flex justify-center pt-2">
              <InputOTP
                maxLength={5}
                value={partnerCode}
                onChange={onChangePartnerCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="size-11 text-base rounded-l-2xl" />
                  <InputOTPSlot index={1} className="size-11 text-base" />
                  <InputOTPSlot index={2} className="size-11 text-base" />
                  <InputOTPSlot index={3} className="size-11 text-base" />
                  <InputOTPSlot index={4} className="size-11 text-base rounded-r-2xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && <FieldError className="text-center text-xs mt-1">{error}</FieldError>}
          </Field>
          <p className="text-center text-[11px] text-muted-foreground">
            Entering your partner's code will instantly connect you both in real time.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}


import { Sparkles, UserPlus, Users } from "lucide-react"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ConnectionChoiceStepProps {
  connectionType: "create" | "join"
  onChangeConnectionType: (type: "create" | "join") => void
  partnerCode: string
  onChangePartnerCode: (code: string) => void
  error?: string | null
}

export function ConnectionChoiceStep({
  connectionType,
  onChangeConnectionType,
  partnerCode,
  onChangePartnerCode,
  error,
}: ConnectionChoiceStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">
          Connect with Partner
        </h3>
        <p className="text-xs text-muted-foreground">
          Join your partner&apos;s existing space or create a brand new one
        </p>
      </div>

      <Tabs
        value={connectionType}
        onValueChange={(val) =>
          onChangeConnectionType(val as "create" | "join")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/60 p-1">
          <TabsTrigger
            value="join"
            className="rounded-xl text-xs font-semibold"
          >
            <UserPlus className="mr-1.5 size-3.5" />
            Join Partner
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="rounded-xl text-xs font-semibold"
          >
            <Users className="mr-1.5 size-3.5" />
            Create Space
          </TabsTrigger>
        </TabsList>

        {/* Option 1: Join Partner's Space (Default) */}
        <TabsContent value="join" className="space-y-4 pt-3 outline-none">
          <Field
            className="items-center gap-2 text-center"
            data-invalid={!!error}
          >
            <FieldLabel className="text-xs font-medium text-muted-foreground">
              Enter Partner&apos;s 5-Digit Code
            </FieldLabel>
            <div className="flex justify-center pt-2">
              <InputOTP
                maxLength={5}
                value={partnerCode}
                onChange={onChangePartnerCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="size-11 rounded-l-2xl text-base"
                  />
                  <InputOTPSlot index={1} className="size-11 text-base" />
                  <InputOTPSlot index={2} className="size-11 text-base" />
                  <InputOTPSlot index={3} className="size-11 text-base" />
                  <InputOTPSlot
                    index={4}
                    className="size-11 rounded-r-2xl text-base"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <FieldError className="mt-1 text-center text-xs">
                {error}
              </FieldError>
            )}
          </Field>
          <p className="text-center text-[11px] text-muted-foreground">
            Enter the 5-digit code generated on your partner&apos;s phone to
            link together immediately.
          </p>
        </TabsContent>

        {/* Option 2: Create Space (Sets up space, code is generated on final step) */}
        <TabsContent value="create" className="space-y-4 pt-3 outline-none">
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-foreground">
                Start a New Couple Space
              </span>
              <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                You&apos;ll be able to customize your anniversary, moods, and
                nudges next. Your 5-digit invite code will be ready on the final
                step!
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

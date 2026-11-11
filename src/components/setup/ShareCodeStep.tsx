import { useState } from "react"
import { Check, Copy, RefreshCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareCodeStepProps {
  inviteCode: string
  onRegenerateCode: () => void
}

export function ShareCodeStep({
  inviteCode,
  onRegenerateCode,
}: ShareCodeStepProps) {
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
        <h3 className="text-base font-semibold tracking-tight">Your Space is Ready!</h3>
        <p className="text-xs text-muted-foreground">
          Share your 5-digit invite code with your partner to connect your spaces
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-muted/20 p-6 text-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Send className="size-3.5" />
          <span>Your 5-Digit Invite Code</span>
        </div>

        {/* 5-Digit Display */}
        <div className="flex items-center gap-1.5 font-mono text-3xl font-extrabold tracking-widest text-primary pt-1">
          {inviteCode.split("").map((digit, i) => (
            <span
              key={i}
              className="flex size-11 items-center justify-center rounded-2xl border border-input bg-background shadow-xs"
            >
              {digit}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="rounded-2xl text-xs gap-1.5 font-semibold"
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

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        💡 Your partner simply needs to choose &ldquo;Join Partner&rdquo; during setup and enter this 5-digit code. You can also view this code anytime in Settings.
      </p>
    </div>
  )
}


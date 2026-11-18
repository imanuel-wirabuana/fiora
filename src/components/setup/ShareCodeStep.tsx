import { useState } from "react"
import { Check, Copy, RefreshCw, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ShareCodeStepProps {
  inviteCode: string
  onRegenerateCode: () => void
}

export function ShareCodeStep({
  inviteCode,
  onRegenerateCode,
}: ShareCodeStepProps) {
  const { t } = useTranslation("setup")
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-muted/20 p-6 text-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Send className="size-3.5" />
          <span>{t("shareCodeStep.title")}</span>
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
                {t("shareCodeStep.copied")}
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                {t("shareCodeStep.copyCode")}
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
            {t("shareCodeStep.regenerate")}
          </Button>
        </div>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("shareCodeStep.hint")}
      </p>
    </div>
  )
}


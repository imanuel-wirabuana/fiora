import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Download, Share, X, PlusSquare } from "lucide-react"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Button } from "@/components/ui/button"

const DISMISSED_KEY = "fiora_pwa_prompt_dismissed"

export function PWAInstallPrompt() {
  const { t } = useTranslation("common")
  const { isStandalone, isIOS, canInstall, install } = usePWAInstall()
  // Only check sessionStorage so user is prompted again in new sessions,
  // or localStorage if you want it once. We'll use sessionStorage so it's not overly intrusive.
  const [isDismissed, setIsDismissed] = useState(() =>
    typeof window !== "undefined" ? Boolean(sessionStorage.getItem(DISMISSED_KEY)) : true
  )
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // If already installed/standalone or dismissed, don't render anything
  if (isStandalone || isDismissed) {
    return null
  }

  // If not iOS and cannot prompt yet, don't show prompt
  if (!canInstall && !isIOS) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, "true")
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    const success = await install()
    if (success) {
      setIsDismissed(true)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-sm px-4">
      <div className="relative flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground/80 hover:text-foreground"
          aria-label={t("pwa.closeAria")}
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <img
            src="/pwa-192x192.png"
            alt="Fiora"
            className="size-12 shrink-0 rounded-xl shadow-xs border border-border"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">
              {t("pwa.title")}
            </span>
            <span className="text-xs text-muted-foreground leading-snug">
              {t("pwa.description")}
            </span>
          </div>
        </div>

        {showIOSInstructions ? (
          <div className="rounded-xl bg-card/70 p-3 text-xs text-foreground/90 space-y-2 border border-border">
            <p className="font-medium text-primary">{t("pwa.iosTitle")}</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Share className="size-3.5 text-primary inline shrink-0" />
                <span>
                  <Trans
                    i18nKey="pwa.iosStep1"
                    ns="common"
                    components={[<strong key="0" />]}
                  />
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <PlusSquare className="size-3.5 text-primary inline shrink-0" />
                <span>
                  <Trans
                    i18nKey="pwa.iosStep2"
                    ns="common"
                    components={[<strong key="0" />]}
                  />
                </span>
              </li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs h-7"
              onClick={() => setShowIOSInstructions(false)}
            >
              {t("pwa.gotIt")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1 text-xs h-8 border-border hover:bg-accent"
            >
              {t("pwa.later")}
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="flex-1 text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              <Download className="size-3.5" />
              {t("pwa.install")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


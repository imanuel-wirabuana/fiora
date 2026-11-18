import { Bell, BellOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { SettingRow } from "./SettingRow"

export function NotificationSection() {
  const { t } = useTranslation("setting")
  const {
    isSupported,
    isStandalone,
    isIOS,
    permission,
    isSubscribed,
    isLoading,
    isPending,
    error,
    togglePush,
  } = usePushNotifications()

  const needsIOSInstall = isIOS && !isStandalone
  const isBlocked = permission === "denied"
  const isBusy = isLoading || isPending
  const isDisabled = !isSupported || needsIOSInstall || isBlocked || isBusy

  let description = t("notification.descriptionDefault")
  if (needsIOSInstall) {
    description = t("notification.descriptionIosInstall")
  } else if (!isSupported) {
    description = t("notification.descriptionUnsupported")
  } else if (isBlocked) {
    description = t("notification.descriptionBlocked")
  } else if (isSubscribed) {
    description = t("notification.descriptionActive")
  }

  return (
    <div className="flex flex-col gap-1">
      <SettingRow
        icon={
          isSubscribed ? (
            <Bell className="size-3.5" />
          ) : (
            <BellOff className="size-3.5 text-muted-foreground" />
          )
        }
        title={t("notification.title")}
        description={description}
        action={
          <div className="flex items-center gap-2">
            {isBusy && <Spinner className="size-3.5 text-primary" />}
            <Switch
              checked={isSubscribed}
              disabled={isDisabled}
              onCheckedChange={() => {
                void togglePush().catch(() => {})
              }}
              aria-label={t("notification.ariaLabel")}
            />
          </div>
        }
      />
      {error && <p className="text-[11px] text-destructive">{error.message}</p>}
    </div>
  )
}

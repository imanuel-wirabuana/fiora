import { Bell, BellOff } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { SettingRow } from "./SettingRow"

export function NotificationSection() {
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

  let description = "Receive alerts on this phone even when Fiora is closed."
  if (needsIOSInstall) {
    description =
      "Add Fiora to your iPhone Home Screen (Share → Add to Home Screen) to enable push notifications."
  } else if (!isSupported) {
    description = "Push notifications are not supported in this browser."
  } else if (isBlocked) {
    description =
      "Notifications are blocked. Enable them in your browser or phone settings."
  } else if (isSubscribed) {
    description = "Active on this device. You will receive partner alerts."
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
        title="Phone Notifications"
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
              aria-label="Toggle phone push notifications"
            />
          </div>
        }
      />
      {error && <p className="text-[11px] text-destructive">{error.message}</p>}
    </div>
  )
}

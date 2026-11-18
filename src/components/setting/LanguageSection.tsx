import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getCurrentLanguage } from "@/lib/i18n"
import { SettingRow } from "./SettingRow"

export function LanguageSection() {
  const { t, i18n } = useTranslation("setting")
  const currentLanguage = getCurrentLanguage()
  const isIndonesian = currentLanguage === "id"

  const handleToggleLanguage = (checked: boolean) => {
    void i18n.changeLanguage(checked ? "id" : "en")
  }

  return (
    <SettingRow
      icon={<Languages className="size-3.5" />}
      title={t("language.title")}
      description={isIndonesian ? t("language.activeId") : t("language.activeEn")}
      action={
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px] uppercase">
            {isIndonesian ? "ID" : "EN"}
          </Badge>
          <Switch
            checked={isIndonesian}
            onCheckedChange={handleToggleLanguage}
            aria-label={t("language.ariaLabel")}
          />
        </div>
      }
    />
  )
}

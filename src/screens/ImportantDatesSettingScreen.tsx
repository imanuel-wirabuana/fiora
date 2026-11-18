import { useTranslation } from "react-i18next"
import { ComingSoonScreen } from "./ComingSoonScreen"

export function ImportantDatesSettingScreen() {
  const { t } = useTranslation("importantDatesSetting")

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-3 pb-20 sm:max-w-2xl">
      <ComingSoonScreen title={t("title")} description={t("description")} />
    </div>
  )
}


import { useTranslation } from "react-i18next"

export function NotFoundScreen() {
  const { t } = useTranslation("notFound")
  return <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
}

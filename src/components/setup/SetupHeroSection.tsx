import { useTranslation } from "react-i18next"
import { Brand } from "@/components/Brand"

export function SetupHeroSection() {
  const { t } = useTranslation("setup")

  return (
    <div className="flex shrink-0 flex-col items-center justify-center px-6 pt-7 pb-3 text-primary-foreground">
      <Brand
        showLogo
        logoVariant="glass"
        size="default"
        align="center"
        subtitle={t("heroSubtitle")}
      />
    </div>
  )
}

import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ComingSoonScreenProps {
  title?: string
  description?: string
}

export function ComingSoonScreen({
  title,
  description,
}: ComingSoonScreenProps) {
  const { t } = useTranslation("comingSoon")

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h2 className="text-base font-semibold text-foreground">
        {title ?? t("title")}
      </h2>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {description ?? t("description")}
      </p>
    </div>
  )
}


import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { Gender } from "@/types/relationship"

interface GenderStepProps {
  gender: Gender | null
  onSelectGender: (gender: Gender) => void
}

export function GenderStep({ gender, onSelectGender }: GenderStepProps) {
  const { t } = useTranslation("setup")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Male */}
        <button
          type="button"
          onClick={() => onSelectGender("male")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-6 transition-all active:scale-[0.98]",
            gender === "male"
              ? "border-sky-500 bg-sky-500/10 shadow-xs"
              : "border-border hover:bg-muted/40"
          )}
        >
          <span className="text-4xl" role="img" aria-label={t("genderStep.male")}>
            🙋‍♂️
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              gender === "male"
                ? "text-sky-600 dark:text-sky-400"
                : "text-foreground"
            )}
          >
            {t("genderStep.male")}
          </span>
        </button>

        {/* Female */}
        <button
          type="button"
          onClick={() => onSelectGender("female")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-6 transition-all active:scale-[0.98]",
            gender === "female"
              ? "border-rose-500 bg-rose-500/10 shadow-xs"
              : "border-border hover:bg-muted/40"
          )}
        >
          <span
            className="text-4xl"
            role="img"
            aria-label={t("genderStep.female")}
          >
            🙋‍♀️
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              gender === "female"
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
            )}
          >
            {t("genderStep.female")}
          </span>
        </button>
      </div>
    </div>
  )
}

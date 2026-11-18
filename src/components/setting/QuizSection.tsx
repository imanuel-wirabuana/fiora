import { HelpCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CustomSelect } from "@/components/pickers"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { DAILY_QUIZ_COUNT_OPTIONS } from "@/lib/relationship"
import { SettingRow } from "./SettingRow"

export function QuizSection() {
  const { t } = useTranslation("setting")
  const { relationship, dailyQuizCount, hasRelationship } = useRelationship()
  const { updateDailyQuizCount } = useQuiz()

  if (!hasRelationship || !relationship) {
    return null
  }

  const quizOptions = DAILY_QUIZ_COUNT_OPTIONS.map((count) => ({
    label: t("quiz.option", { count }),
    value: count,
  }))

  const currentLabel =
    quizOptions.find((opt) => opt.value === dailyQuizCount)?.label ??
    t("quiz.placeholder")

  return (
    <SettingRow
      icon={<HelpCircle className="size-3.5" />}
      title={t("quiz.title")}
      description={t("quiz.description")}
      action={
        <CustomSelect
          value={dailyQuizCount}
          onValueChange={updateDailyQuizCount}
          options={quizOptions}
          placeholder={t("quiz.placeholder")}
          title={t("quiz.title")}
          description={t("quiz.description")}
          trigger={
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 rounded-xl px-2.5 text-xs font-medium"
            >
              {currentLabel}
            </Button>
          }
        />
      }
    />
  )
}

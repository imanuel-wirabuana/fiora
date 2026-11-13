import { HelpCircle } from "lucide-react"
import { CustomSelect } from "@/components/pickers"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { DAILY_QUIZ_COUNT_OPTIONS } from "@/lib/relationship"
import { SettingRow } from "./SettingRow"

export function QuizSection() {
  const { relationship, dailyQuizCount, hasRelationship } = useRelationship()
  const { updateDailyQuizCount } = useQuiz()

  if (!hasRelationship || !relationship) {
    return null
  }

  const quizOptions = DAILY_QUIZ_COUNT_OPTIONS.map((count) => ({
    label: `${count} ${count === 1 ? "question" : "questions"}`,
    value: count,
  }))

  const currentLabel =
    quizOptions.find((opt) => opt.value === dailyQuizCount)?.label ??
    "Questions"

  return (
    <SettingRow
      icon={<HelpCircle className="size-3.5" />}
      title="Daily Quiz"
      description="Questions per day on home screen."
      action={
        <CustomSelect
          value={dailyQuizCount}
          onValueChange={updateDailyQuizCount}
          options={quizOptions}
          placeholder="Questions"
          title="Daily Quiz"
          description="Questions per day on home screen."
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

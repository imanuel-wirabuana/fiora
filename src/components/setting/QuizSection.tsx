import { HelpCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

  const handleValueChange = (val: string | null) => {
    if (!val) return
    const num = Number.parseInt(val, 10)
    if (!Number.isNaN(num)) {
      updateDailyQuizCount(num)
    }
  }

  return (
    <SettingRow
      icon={<HelpCircle className="size-3.5" />}
      title="Daily Quiz"
      description="Questions per day on home screen."
      action={
        <Select
          value={String(dailyQuizCount)}
          onValueChange={handleValueChange}
        >
          <SelectTrigger
            size="sm"
            className="h-7 w-auto min-w-[95px] rounded-xl border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted/40"
          >
            <SelectValue placeholder="Questions" />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[120px] rounded-xl p-1 text-xs">
            {DAILY_QUIZ_COUNT_OPTIONS.map((count) => (
              <SelectItem key={count} value={String(count)} className="text-xs">
                {count} {count === 1 ? "question" : "questions"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  )
}

import { HelpCircle } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { DAILY_QUIZ_COUNT_OPTIONS } from "@/lib/relationship"
import { cn } from "@/lib/utils"

export function QuizSection() {
  const { relationship, dailyQuizCount, hasRelationship } = useRelationship()

  const { updateDailyQuizCount } = useQuiz()

  if (!hasRelationship || !relationship) {
    return null
  }

  return (
    <CustomItem
      variant="outline"
      icon={<HelpCircle className="size-3.5 text-primary" />}
      title="Daily Quiz"
      topRightActions={
        <span className="text-[11px] font-medium text-primary/80">
          {dailyQuizCount} {dailyQuizCount === 1 ? "question" : "questions"} /
          day
        </span>
      }
      contentClassName="space-y-2"
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="size-3.5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="text-xs font-medium text-foreground">
              Questions Per Day
            </span>
            <p className="text-[11px] leading-tight text-muted-foreground">
              Control how many daily quizzes appear on the home screen.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {DAILY_QUIZ_COUNT_OPTIONS.map((count) => {
            const isSelected = dailyQuizCount === count
            return (
              <Button
                key={count}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="xs"
                onClick={() => updateDailyQuizCount(count)}
                className={cn(
                  "size-7 rounded-lg p-0 text-xs font-semibold",
                  !isSelected && "text-muted-foreground hover:text-foreground"
                )}
              >
                {count}
              </Button>
            )
          })}
        </div>
      </div>
    </CustomItem>
  )
}

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { DAILY_QUIZ_COUNT_OPTIONS } from "@/lib/relationship"
import { cn } from "@/lib/utils"

export function QuizSection() {
  const {
    relationship,
    dailyQuizCount,
    hasRelationship,
  } = useRelationship()

  const { updateDailyQuizCount } = useQuiz()

  if (!hasRelationship || !relationship) {
    return null
  }

  return (
    <Item variant="outline" className="w-full flex-col items-start gap-2.5 p-3.5">
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <ItemTitle className="text-sm font-semibold">Daily Quiz</ItemTitle>
        <span className="text-[11px] font-medium text-muted-foreground">
          {dailyQuizCount} {dailyQuizCount === 1 ? "question" : "questions"} / day
        </span>
      </ItemHeader>

      <ItemContent className="w-full space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5">
          <div className="flex items-start gap-2 min-w-0">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="size-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-medium text-foreground">
                Questions Per Day
              </span>
              <ItemDescription className="text-[11px] leading-tight text-muted-foreground">
                Control how many daily quizzes appear on the home screen.
              </ItemDescription>
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
      </ItemContent>
    </Item>
  )
}

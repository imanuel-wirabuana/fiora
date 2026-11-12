import {
  HelpCircle,
  Lock,
  Sparkles,
} from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

export function QuizSummarySection() {
  const {
    todayQuizzes,
    totalCount,
    myAnsweredCount,
    partnerAnsweredCount,
    matchedCount,
    isAllBothAnswered,
    isLoading,
  } = useQuiz()

  const { partnerMember, currentMember } = useRelationship()

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const myAvatar = currentMember?.content?.avatar || "🙋"

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  if (todayQuizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
        <Sparkles className="size-8 opacity-40" />
        <p className="text-xs">No daily quizzes for today.</p>
      </div>
    )
  }

  const matchPercentage =
    totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0

  return (
    <section className="flex flex-col gap-3">
      {/* Overall Score / Waiting Banner */}
      <CustomItem
        variant="fill"
        icon={<Sparkles className="size-3.5 text-primary-foreground" />}
        title="Today's Results"
        topRightActions={
          <Badge
            variant="outline"
            className="border-primary-foreground/25 bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
          >
            {myAnsweredCount}/{totalCount} Answered
          </Badge>
        }
        contentClassName="space-y-2"
      >
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border p-3 text-xs",
            isAllBothAnswered
              ? "border-emerald-300/35 bg-primary-foreground/15"
              : "border-primary-foreground/20 bg-primary-foreground/10"
          )}
        >
          {isAllBothAnswered ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Sparkles className="size-4 shrink-0 text-emerald-300" />
                  <span className="truncate text-xs font-semibold text-primary-foreground">
                    Matched {matchedCount} of {totalCount} quizzes!
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-400/25 px-2 py-0.5 text-xs font-bold text-white">
                  {matchPercentage}% Match
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all duration-300"
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-primary-foreground/85">
              <Lock className="size-4 shrink-0 text-primary-foreground/75" />
              <span className="text-xs leading-tight">
                Waiting for {partnerName} to finish ({partnerAnsweredCount}/
                {totalCount} answered). Both answers will reveal once done!
              </span>
            </div>
          )}
        </div>
      </CustomItem>

      {/* Per-Quiz Breakdown Cards */}
      <div className="flex flex-col gap-2.5">
        {todayQuizzes.map((item, idx) => {
          const qContent = item.quiz.content
          if (!qContent) return null
          const myChoice = item.myAnswer?.content?.selectedOption
          const partnerChoice = item.partnerAnswer?.content?.selectedOption

          return (
            <CustomItem
              key={item.quiz.id}
              variant={item.isMatched ? "outline" : "default"}
              className="gap-2 p-3"
              icon={<HelpCircle className="size-3.5 text-primary" />}
              title={`Question #${idx + 1}`}
              topRightActions={
                isAllBothAnswered ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-0 px-1.5 py-0 text-[9px] font-medium",
                      item.isMatched
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {item.isMatched ? "Match ✨" : "Diff 💬"}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[9px] font-normal"
                  >
                    Waiting for {partnerName} 🔒
                  </Badge>
                )
              }
              contentClassName="space-y-2 pt-0.5"
            >
              {qContent.tags && qContent.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {qContent.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-primary/20 bg-primary/5 px-1 py-0 text-[8px] font-normal text-muted-foreground"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-xs leading-snug font-medium break-words text-foreground">
                {qContent.question}
              </p>

              {/* Answers Comparison */}
              <div className="grid gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2 text-xs">
                <div className="flex min-w-0 items-start gap-1.5">
                  <span className="shrink-0 font-medium text-primary">
                    {myAvatar} You:
                  </span>
                  <span className="min-w-0 flex-1 break-words text-foreground/90">
                    {myChoice || (
                      <span className="italic text-muted-foreground">
                        Not answered
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex min-w-0 items-start gap-1.5">
                  <span className="shrink-0 font-medium text-rose-500">
                    {partnerAvatar} {partnerName}:
                  </span>
                  {isAllBothAnswered ? (
                    <span className="min-w-0 flex-1 break-words text-foreground/90">
                      {partnerChoice}
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground">
                      Locked until {partnerName} finishes 🔒
                    </span>
                  )}
                </div>
              </div>
            </CustomItem>
          )
        })}
      </div>
    </section>
  )
}

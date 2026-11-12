import {
  Lock,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
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
      <Item variant="outline" className="w-full flex-col items-start gap-2.5 p-3.5">
        <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
          <ItemTitle className="text-sm font-semibold">Today's Results</ItemTitle>
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-[10px] font-medium"
          >
            {myAnsweredCount}/{totalCount} Answered
          </Badge>
        </ItemHeader>

        <ItemContent className="w-full space-y-2">
          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-3 text-xs",
              isAllBothAnswered
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-border/60 bg-muted/20"
            )}
          >
            {isAllBothAnswered ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="size-4 shrink-0 text-emerald-500" />
                    <span className="font-semibold text-xs text-foreground truncate">
                      Matched {matchedCount} of {totalCount} quizzes!
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {matchPercentage}% Match
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="size-4 shrink-0 text-muted-foreground/70" />
                <span className="text-xs leading-tight">
                  Waiting for {partnerName} to finish ({partnerAnsweredCount}/
                  {totalCount} answered). Both answers will reveal once done!
                </span>
              </div>
            )}
          </div>
        </ItemContent>
      </Item>

      {/* Per-Quiz Breakdown Cards */}
      <div className="flex flex-col gap-2.5">
        {todayQuizzes.map((item, idx) => {
          const qContent = item.quiz.content
          if (!qContent) return null
          const myChoice = item.myAnswer?.content?.selectedOption
          const partnerChoice = item.partnerAnswer?.content?.selectedOption

          return (
            <Item
              key={item.quiz.id}
              variant="outline"
              className="w-full max-w-full overflow-hidden flex-col items-start gap-2 p-3"
            >
              <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  {qContent.tags?.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-primary/20 bg-primary/5 px-1 py-0 text-[8px] font-normal text-muted-foreground"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {item.isBothAnswered ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-1.5 py-0 text-[9px] font-medium border-0",
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
                )}
              </ItemHeader>

              <ItemContent className="w-full min-w-0 space-y-2 pt-0.5">
                <p className="text-xs font-medium text-foreground leading-snug break-words">
                  {qContent.question}
                </p>

                {/* Answers Comparison */}
                <div className="grid gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2 text-xs">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="shrink-0 font-medium text-primary">
                      {myAvatar} You:
                    </span>
                    <span className="text-foreground/90 break-words min-w-0 flex-1">
                      {myChoice || <span className="italic text-muted-foreground">Not answered</span>}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 min-w-0">
                    <span className="shrink-0 font-medium text-rose-500">
                      {partnerAvatar} {partnerName}:
                    </span>
                    {item.isBothAnswered ? (
                      <span className="text-foreground/90 break-words min-w-0 flex-1">
                        {partnerChoice}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Locked until {partnerName} answers 🔒
                      </span>
                    )}
                  </div>
                </div>
              </ItemContent>
            </Item>
          )
        })}
      </div>
    </section>
  )
}

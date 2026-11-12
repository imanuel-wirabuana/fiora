import { useState } from "react"
import { useLocation } from "wouter"
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Sparkles,
} from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

export function DailyQuizSection() {
  const [, setLocation] = useLocation()
  const {
    todayQuizzes,
    totalCount,
    myAnsweredCount,
    partnerAnsweredCount,
    isAllMyAnswered,
    isAllBothAnswered,
    hoursUntilNextQuiz,
    isLoading,
    isSubmitting,
    submitAnswer,
  } = useQuiz()

  const { partnerMember, currentMember, hasRelationship } = useRelationship()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pendingOption, setPendingOption] = useState<{
    quizId: number
    option: string
  } | null>(null)

  const partnerName = partnerMember?.content?.name || "Partner"
  const myAvatar = currentMember?.content?.avatar || "🙋"

  if (!hasRelationship) {
    return null
  }

  if (isLoading) {
    return (
      <CustomItem
        variant="outline"
        icon={<Sparkles className="size-3.5" />}
        title="Daily Quiz"
        className="p-3"
        contentClassName="items-center justify-center gap-1.5 py-2"
      >
        <Spinner className="size-4 text-primary" />
        <span className="text-[11px] text-primary/80">Loading quiz...</span>
      </CustomItem>
    )
  }

  if (todayQuizzes.length === 0) {
    return (
      <CustomItem
        variant="outline"
        icon={<Sparkles className="size-3.5" />}
        title="Daily Quiz"
        topRightActions={
          <Badge
            variant="secondary"
            className="bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
          >
            All Caught Up
          </Badge>
        }
        description="You and your partner have completed all available quizzes!"
        descriptionClassName="text-[11px]"
        className="gap-1.5 p-3"
      />
    )
  }

  const nextQuizTimeLabel = `${hoursUntilNextQuiz} ${
    hoursUntilNextQuiz === 1 ? "hour" : "hours"
  }`

  if (isAllMyAnswered) {
    return (
      <CustomItem
        variant="outline"
        icon={<Sparkles className="size-3.5" />}
        title="Daily Quiz"
        topRightActions={
          <Badge
            variant="secondary"
            className="gap-1 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
          >
            <Clock className="size-3 shrink-0" />
            <span>New quiz in {nextQuizTimeLabel}</span>
          </Badge>
        }
        className="p-3"
        contentClassName="space-y-2.5"
      >
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 text-[11px] leading-snug text-primary">
          {isAllBothAnswered ? (
            <>
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>
                You and {partnerName} finished all {totalCount} questions! Your
                quiz summary is ready.
              </span>
            </>
          ) : (
            <>
              <Lock className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
              <span>
                All {totalCount} answered! Waiting for {partnerName} (
                {partnerAnsweredCount}/{totalCount}) to unlock full results.
              </span>
            </>
          )}
        </div>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setLocation("/quiz-summary")}
          className="h-8 w-full gap-1.5 text-xs font-semibold"
        >
          <span>View Quiz Summary</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </CustomItem>
    )
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, todayQuizzes.length - 1))
  const currentItem = todayQuizzes[safeIndex]

  const { quiz, myAnswer } = currentItem
  const { question, options, tags } = quiz.content || {
    question: "",
    options: [],
    tags: [],
  }

  const hasMyAnswer = !!myAnswer
  const myChosenOption =
    myAnswer?.content?.selectedOption ??
    (pendingOption?.quizId === quiz.id ? pendingOption.option : null)

  const handleSelectOption = async (option: string, optionIdx: number) => {
    if (hasMyAnswer || isSubmitting) return
    setPendingOption({ quizId: quiz.id, option })
    try {
      await submitAnswer(quiz.id, option, optionIdx)
      setPendingOption(null)

      const nextUnansweredIdx = todayQuizzes.findIndex(
        (item, idx) => idx !== safeIndex && !item.myAnswer
      )

      if (nextUnansweredIdx !== -1) {
        setCurrentIndex(nextUnansweredIdx)
      }
    } catch {
      setPendingOption(null)
    }
  }

  return (
    <CustomItem
      variant="outline"
      icon={<Sparkles className="size-3.5" />}
      title="Daily Quiz"
      topRightActions={
        totalCount > 1 ? (
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
            {safeIndex + 1}/{totalCount}
          </span>
        ) : null
      }
      className="gap-2 p-3"
      contentClassName="space-y-2"
      footerClassName="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] text-primary"
      bottomLeftInfo={
        hasMyAnswer ? (
          <>
            <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium">
              Saved! ({myAnsweredCount}/{totalCount} answered)
            </span>
          </>
        ) : (
          <span className="truncate text-primary/80">
            {myAnsweredCount}/{totalCount} answered · Complete all to see
            results
          </span>
        )
      }
      bottomRightActions={
        totalCount > 1 ? (
          <div className="flex shrink-0 items-center gap-0.5 border-l border-primary/20 pl-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={safeIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="size-5 rounded-md text-primary hover:bg-primary/10 hover:text-primary"
              title="Previous quiz"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={safeIndex >= totalCount - 1}
              onClick={() =>
                setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))
              }
              className="size-5 rounded-md text-primary hover:bg-primary/10 hover:text-primary"
              title="Next quiz"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        ) : null
      }
    >
      {/* Question */}
      <p className="text-[11px] leading-snug font-medium break-words text-primary">
        {question}
      </p>

      {/* Tags between Question and Options */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-primary/25 bg-primary/5 px-1 py-0 text-[8px] font-normal text-primary/80"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="grid w-full min-w-0 gap-1.5">
        {options.map((option, idx) => {
          const isMyChoice = myChosenOption === option

          return (
            <Button
              key={`${idx}-${option}`}
              type="button"
              variant="outline"
              disabled={hasMyAnswer || isSubmitting}
              onClick={() => handleSelectOption(option, idx)}
              className={cn(
                "relative flex h-auto min-h-9 w-full max-w-full min-w-0 items-start justify-between rounded-lg border-primary/25 px-2.5 py-2 text-left text-xs font-normal break-words whitespace-normal text-primary transition-all",
                isMyChoice &&
                  "border-primary bg-primary/10 font-medium shadow-2xs",
                !hasMyAnswer &&
                  "cursor-pointer hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
              )}
            >
              <div className="flex min-w-0 flex-1 items-start gap-2 pr-1.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none font-medium",
                    isMyChoice
                      ? "border-primary bg-primary font-bold text-primary-foreground"
                      : "border-primary/35 text-primary"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="min-w-0 flex-1 text-left text-[11px] leading-snug break-words whitespace-normal text-primary">
                  {option}
                </span>
              </div>

              {isMyChoice && (
                <div className="mt-0.5 ml-1 flex shrink-0 items-center">
                  <span
                    title="You chose this"
                    className="py-0.2 flex shrink-0 items-center gap-0.5 rounded-full bg-primary/20 px-1.5 text-[9px] font-medium text-primary"
                  >
                    <span>{myAvatar}</span> You
                  </span>
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </CustomItem>
  )
}

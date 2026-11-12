import { useState } from "react"
import { useLocation } from "wouter"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Lock,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemHeader, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

export function DailyQuizSection() {
  const [, setLocation] = useLocation()
  const {
    todayQuizzes,
    totalCount,
    isAllMyAnswered,
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
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const myAvatar = currentMember?.content?.avatar || "🙋"

  if (!hasRelationship) {
    return null
  }

  if (isLoading) {
    return (
      <Item
        variant="outline"
        className="w-full max-w-full flex-col items-center justify-center overflow-hidden p-4"
      >
        <Spinner className="size-4 text-primary" />
        <span className="mt-1.5 text-[11px] text-muted-foreground">
          Loading quiz...
        </span>
      </Item>
    )
  }

  if (todayQuizzes.length === 0) {
    return (
      <Item
        variant="outline"
        className="w-full max-w-full flex-col items-start gap-1.5 overflow-hidden p-3"
      >
        <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
          <ItemTitle className="text-xs font-semibold">Daily Quiz</ItemTitle>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            All Caught Up
          </Badge>
        </ItemHeader>
        <ItemContent className="text-[11px] text-muted-foreground">
          You and your partner have completed all available quizzes!
        </ItemContent>
      </Item>
    )
  }

  const safeIndex = Math.min(currentIndex, Math.max(0, todayQuizzes.length - 1))
  const currentItem = todayQuizzes[safeIndex]

  const { quiz, myAnswer, partnerAnswer, isBothAnswered, isMatched } =
    currentItem
  const { question, options, tags } = quiz.content || {
    question: "",
    options: [],
    tags: [],
  }

  const hasMyAnswer = !!myAnswer
  const myChosenOption =
    myAnswer?.content?.selectedOption ??
    (pendingOption?.quizId === quiz.id ? pendingOption.option : null)
  const partnerChosenOption = partnerAnswer?.content?.selectedOption

  const handleSelectOption = async (option: string, optionIdx: number) => {
    if (hasMyAnswer || isSubmitting) return
    setPendingOption({ quizId: quiz.id, option })
    try {
      await submitAnswer(quiz.id, option, optionIdx)
      setPendingOption(null)

      // Find next unanswered quiz if any
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
    <Item
      variant="outline"
      className="w-full max-w-full flex-col items-start gap-2 overflow-hidden p-3"
    >
      {/* Header */}
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <ItemTitle className="shrink-0 text-xs font-semibold">
          Daily Quiz
        </ItemTitle>

        <div className="flex shrink-0 items-center gap-1.5">
          {isAllMyAnswered && (
            <Button
              type="button"
              variant="default"
              size="xs"
              onClick={() => setLocation("/quiz-summary")}
              className="h-5 gap-1 rounded-full px-1.5 text-[10px]"
            >
              View Summary
            </Button>
          )}

          {totalCount > 1 && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
              {safeIndex + 1}/{totalCount}
            </span>
          )}
        </div>
      </ItemHeader>

      <ItemContent className="w-full min-w-0 space-y-2">
        {/* Question */}
        <p className="text-[11px] leading-snug font-medium break-words text-foreground">
          {question}
        </p>

        {/* Tags between Question and Options */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((tag) => (
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

        {/* Options */}
        <div className="grid w-full min-w-0 gap-1.5">
          {options.map((option, idx) => {
            const isMyChoice = myChosenOption === option
            const isPartnerChoice =
              isBothAnswered && partnerChosenOption === option

            return (
              <Button
                key={`${idx}-${option}`}
                type="button"
                variant="outline"
                disabled={hasMyAnswer || isSubmitting}
                onClick={() => handleSelectOption(option, idx)}
                className={cn(
                  "relative flex h-auto min-h-9 w-full max-w-full min-w-0 items-start justify-between rounded-lg px-2.5 py-2 text-left text-xs font-normal break-words whitespace-normal transition-all",
                  isMyChoice &&
                    "border-primary bg-primary/10 font-medium shadow-2xs",
                  isBothAnswered &&
                    isPartnerChoice &&
                    !isMyChoice &&
                    "border-rose-400/80 bg-rose-500/5",
                  isMatched &&
                    isMyChoice &&
                    "border-emerald-500 bg-emerald-500/10",
                  !hasMyAnswer &&
                    "cursor-pointer hover:border-primary/50 hover:bg-muted/40 active:scale-[0.99]"
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-2 pr-1.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none font-medium",
                      isMyChoice
                        ? "border-primary bg-primary font-bold text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="min-w-0 flex-1 text-left text-[11px] leading-snug break-words whitespace-normal text-foreground">
                    {option}
                  </span>
                </div>

                {/* Badges for who selected this option */}
                <div className="mt-0.5 ml-1 flex shrink-0 items-center gap-1">
                  {isMyChoice && (
                    <span
                      title="You chose this"
                      className="py-0.2 flex shrink-0 items-center gap-0.5 rounded-full bg-primary/20 px-1.5 text-[9px] font-medium text-primary"
                    >
                      <span>{myAvatar}</span> You
                    </span>
                  )}
                  {isBothAnswered && isPartnerChoice && (
                    <span
                      title={`${partnerName} chose this`}
                      className="py-0.2 flex shrink-0 items-center gap-0.5 rounded-full bg-rose-500/20 px-1.5 text-[9px] font-medium text-rose-600 dark:text-rose-400"
                    >
                      <span>{partnerAvatar}</span> {partnerName}
                    </span>
                  )}
                </div>
              </Button>
            )
          })}
        </div>

        {/* Status / Reveal Footer with Next/Prev on bottom right */}
        <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 text-[11px]">
          <div className="flex min-w-0 flex-1 items-center">
            {isBothAnswered ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-foreground">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                <span className="text-[11px] leading-tight font-medium break-words">
                  {isMatched
                    ? "Match! Same wavelength ✨"
                    : "Different choices! Great talking point 💬"}
                </span>
              </div>
            ) : hasMyAnswer ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground">
                <Lock className="size-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">
                  Answered! {partnerName}'s choice is locked until they answer.
                </span>
              </div>
            ) : partnerAnswer ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-primary">
                <Sparkles className="size-3 shrink-0" />
                <span className="truncate font-medium">
                  {partnerName} answered! Choose to reveal both.
                </span>
              </div>
            ) : (
              <span className="truncate text-muted-foreground">
                Pick an answer! Revealed once both submit.
              </span>
            )}
          </div>

          {/* Next/Prev buttons on bottom right */}
          {totalCount > 1 && (
            <div className="flex shrink-0 items-center gap-0.5 border-l border-border/40 pl-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={safeIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="size-5 rounded-md text-muted-foreground"
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
                className="size-5 rounded-md text-muted-foreground"
                title="Next quiz"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </ItemContent>
    </Item>
  )
}

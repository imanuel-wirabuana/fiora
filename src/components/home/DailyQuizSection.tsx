import { useState } from "react"
import { CheckCircle2, Lock, Sparkles, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

export function DailyQuizSection() {
  const {
    todayQuiz,
    myAnswer,
    partnerAnswer,
    isBothAnswered,
    isLoading,
    isSubmitting,
    submitAnswer,
  } = useQuiz()

  const { partnerMember, currentMember, hasRelationship } = useRelationship()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

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
        className="w-full flex-col items-center justify-center p-6"
      >
        <Spinner className="size-5 text-primary" />
        <span className="mt-2 text-xs text-muted-foreground">
          Loading daily quiz...
        </span>
      </Item>
    )
  }

  if (!todayQuiz || !todayQuiz.content) {
    return (
      <Item
        variant="outline"
        className="w-full flex-col items-start gap-2 p-3.5"
      >
        <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
          <ItemTitle className="text-sm font-semibold">Daily Quiz</ItemTitle>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            All Caught Up
          </Badge>
        </ItemHeader>
        <ItemContent className="text-xs text-muted-foreground">
          You and your partner have completed all available quizzes! New quizzes
          will appear once generated.
        </ItemContent>
      </Item>
    )
  }

  const { question, options, tags } = todayQuiz.content
  const hasMyAnswer = !!myAnswer
  const myChosenOption = myAnswer?.content?.selectedOption ?? selectedOption
  const partnerChosenOption = partnerAnswer?.content?.selectedOption

  const handleSelectOption = async (option: string, idx: number) => {
    if (hasMyAnswer || isSubmitting) return
    setSelectedOption(option)
    try {
      await submitAnswer(option, idx)
    } catch {
      setSelectedOption(null)
    }
  }

  const isMatched =
    isBothAnswered &&
    myAnswer?.content?.selectedOption === partnerAnswer?.content?.selectedOption

  return (
    <Item variant="outline" className="w-full flex-col items-start gap-3 p-3.5">
      {/* Header */}
      <ItemHeader className="w-full flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="size-4 text-primary" />
          <ItemTitle className="text-sm font-semibold">Daily Quiz</ItemTitle>
        </div>

        <div className="flex items-center gap-1">
          {tags?.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-primary/20 bg-primary/5 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
            >
              #{tag}
            </Badge>
          ))}
          {isBothAnswered ? (
            <Badge className="border-0 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Completed
            </Badge>
          ) : hasMyAnswer ? (
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              Waiting for {partnerName}
            </Badge>
          ) : (
            <Badge
              variant="default"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              Today's Quiz
            </Badge>
          )}
        </div>
      </ItemHeader>

      <ItemContent className="w-full space-y-3">
        {/* Question */}
        <p className="text-xs leading-relaxed font-medium text-foreground">
          {question}
        </p>

        {/* Options */}
        <div className="grid gap-2">
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
                  "relative flex h-auto min-h-12 w-full items-start justify-between rounded-xl p-3 text-left whitespace-normal transition-all",
                  isMyChoice && "border-primary bg-primary/10 shadow-xs",
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
                <div className="flex flex-1 items-start gap-2 pr-2">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                      isMyChoice
                        ? "border-primary bg-primary font-bold text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs leading-snug font-normal text-foreground">
                    {option}
                  </span>
                </div>

                {/* Badges for who selected this option */}
                <div className="flex shrink-0 items-center gap-1">
                  {isMyChoice && (
                    <span
                      title="You chose this"
                      className="flex items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                    >
                      <span>{myAvatar}</span> You
                    </span>
                  )}
                  {isBothAnswered && isPartnerChoice && (
                    <span
                      title={`${partnerName} chose this`}
                      className="flex items-center gap-0.5 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400"
                    >
                      <span>{partnerAvatar}</span> {partnerName}
                    </span>
                  )}
                </div>
              </Button>
            )
          })}
        </div>

        {/* Status / Reveal Footer */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
          {isBothAnswered ? (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="font-medium text-foreground">
                  {isMatched
                    ? "Match! You're on the same wavelength ✨"
                    : "Different choices! Great talking point 💬"}
                </span>
              </div>
            </div>
          ) : hasMyAnswer ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span>
                You've answered! {partnerName}'s choice is locked until they
                submit theirs.
              </span>
            </div>
          ) : partnerAnswer ? (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span className="font-medium">
                {partnerName} has already answered! Answer to reveal both
                choices.
              </span>
            </div>
          ) : (
            <ItemDescription className="text-[11px] text-muted-foreground">
              Pick an answer! Once both of you submit, each other's choice will
              be revealed.
            </ItemDescription>
          )}
        </div>
      </ItemContent>
    </Item>
  )
}

import { useCallback, useMemo, useState } from "react"
import { format, formatDistanceToNow, isToday } from "date-fns"
import { HelpCircle, History, Lock, Sparkles } from "lucide-react"
import { CustomItem } from "@/components/CustomItem"
import { CustomTabs } from "@/components/CustomTabs"
import { Badge } from "@/components/ui/badge"
import { CustomSkeleton } from "@/components/CustomSkeleton"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useQuiz } from "@/hooks/useQuiz"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"

const QUIZ_SUMMARY_PAGE_SIZE = 15

function formatQuizTime(dateStr: string) {
  const date = new Date(dateStr)
  const exactTime = format(date, "h:mm a")
  if (isToday(date)) {
    return `${exactTime} · ${formatDistanceToNow(date, { addSuffix: true })}`
  }
  return `${format(date, "MMM d")} · ${exactTime}`
}

export function QuizSummarySection() {
  const {
    todayQuizzes,
    answeredQuizzes,
    totalCount,
    myAnsweredCount,
    partnerAnsweredCount,
    matchedCount,
    isAllBothAnswered,
    isLoading,
  } = useQuiz()

  const { partnerMember, currentMember } = useRelationship()
  const [activeTab, setActiveTab] = useState<"today" | "history">("today")
  const [todayVisibleCount, setTodayVisibleCount] = useState(
    QUIZ_SUMMARY_PAGE_SIZE
  )
  const [historyVisibleCount, setHistoryVisibleCount] = useState(
    QUIZ_SUMMARY_PAGE_SIZE
  )

  const visibleTodayQuizzes = useMemo(
    () => todayQuizzes.slice(0, todayVisibleCount),
    [todayQuizzes, todayVisibleCount]
  )
  const hasMoreToday = todayVisibleCount < todayQuizzes.length

  const sortedHistoryQuizzes = useMemo(
    () =>
      [...answeredQuizzes].sort(
        (a, b) =>
          new Date(b.latestAnsweredAt).getTime() -
          new Date(a.latestAnsweredAt).getTime()
      ),
    [answeredQuizzes]
  )
  const visibleHistoryQuizzes = useMemo(
    () => sortedHistoryQuizzes.slice(0, historyVisibleCount),
    [sortedHistoryQuizzes, historyVisibleCount]
  )
  const hasMoreHistory = historyVisibleCount < sortedHistoryQuizzes.length

  const loadMoreToday = useCallback(() => {
    setTodayVisibleCount((prev) => prev + QUIZ_SUMMARY_PAGE_SIZE)
  }, [])

  const loadMoreHistory = useCallback(() => {
    setHistoryVisibleCount((prev) => prev + QUIZ_SUMMARY_PAGE_SIZE)
  }, [])

  const todaySentinelRef = useInfiniteScroll({
    hasNextPage: hasMoreToday,
    isFetchingNextPage: false,
    fetchNextPage: loadMoreToday,
  })

  const historySentinelRef = useInfiniteScroll({
    hasNextPage: hasMoreHistory,
    isFetchingNextPage: false,
    fetchNextPage: loadMoreHistory,
  })

  const partnerName = partnerMember?.content?.name || "Partner"
  const partnerAvatar = partnerMember?.content?.avatar || "🤍"
  const myAvatar = currentMember?.content?.avatar || "🙋"

  if (isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <CustomSkeleton className="h-9 w-full rounded-full" />
        <CustomSkeleton className="h-24 w-full" />
        {Array.from({ length: 3 }).map((_, idx) => (
          <CustomSkeleton key={idx} className="h-32 w-full" />
        ))}
      </section>
    )
  }

  const matchPercentage =
    totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0

  return (
    <section className="flex flex-col gap-3">
      <CustomTabs
        value={activeTab}
        onValueChange={setActiveTab}
        items={[
          {
            value: "today",
            label: "Today",
            icon: <Sparkles className="size-3.5" />,
            badge: todayQuizzes.length,
          },
          {
            value: "history",
            label: "History",
            icon: <History className="size-3.5" />,
            badge: sortedHistoryQuizzes.length,
          },
        ]}
      />

      {activeTab === "today" ? (
        <div className="flex flex-col gap-3">
        {todayQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <Sparkles className="size-8 opacity-40" />
            <p className="text-[11px]">No daily quizzes for today.</p>
          </div>
        ) : (
          <>
            {/* Overall Score / Waiting Banner */}
            <CustomItem
              variant="solid"
              icon={<Sparkles className="size-3.5 text-primary-foreground" />}
              title="Today's Results"
              topRightActions={
                <Badge
                  variant="outline"
                  className="border-primary-foreground/25 bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
                >
                  {isAllBothAnswered
                    ? `${matchedCount}/${totalCount} Matched`
                    : `${myAnsweredCount}/${totalCount} Answered`}
                </Badge>
              }
              contentClassName="space-y-2 pt-1"
            >
              <div className="flex w-full flex-col gap-1.5">
                {isAllBothAnswered ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold tracking-tight text-primary-foreground">
                        {matchPercentage}% Compatibility
                      </span>
                      <span className="text-[10px] text-primary-foreground/80">
                        {matchedCount === totalCount
                          ? "Perfect sync! ✨"
                          : matchedCount > 0
                            ? "Great connection 🤍"
                            : "Different minds 💬"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                      <div
                        className="h-full rounded-full bg-emerald-300 transition-all duration-300"
                        style={{ width: `${matchPercentage}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-primary-foreground/85">
                    <Lock className="size-4 shrink-0 text-primary-foreground/75" />
                    <span className="text-[11px] leading-tight">
                      Waiting for {partnerName} to finish (
                      {partnerAnsweredCount}/{totalCount} answered). Both
                      answers will reveal once done!
                    </span>
                  </div>
                )}
              </div>
            </CustomItem>

            {/* Per-Quiz Breakdown Cards */}
            <div className="flex flex-col gap-2.5">
              {visibleTodayQuizzes.map((item, idx) => {
                const qContent = item.quiz.content
                if (!qContent) return null
                const myChoice = item.myAnswer?.content?.selectedOption
                const partnerChoice =
                  item.partnerAnswer?.content?.selectedOption

                return (
                  <CustomItem
                    key={item.quiz.id}
                    variant={item.isMatched ? "soft" : "default"}
                    className="gap-2 p-3 [content-visibility:auto] [contain-intrinsic-size:auto_132px]"
                    icon={<HelpCircle className="size-3.5 text-primary" />}
                    title={`Question ${idx + 1}`}
                    topRightActions={
                      isAllBothAnswered ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px] font-medium",
                            item.isMatched
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {item.isMatched ? "Matched ✨" : "Different 💬"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-muted-foreground/20 bg-muted/50 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
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

                    <p className="text-[11px] leading-snug font-medium break-words text-foreground">
                      {qContent.question}
                    </p>

                    {/* Answers Comparison */}
                    <div className="grid gap-1.5 rounded-lg border border-border/50 bg-muted/20 p-2 text-[11px]">
                      <div className="flex min-w-0 items-start gap-1.5">
                        <span className="shrink-0 font-medium text-primary">
                          {myAvatar} You:
                        </span>
                        <span className="min-w-0 flex-1 break-words text-foreground/90">
                          {myChoice || (
                            <span className="text-muted-foreground italic">
                              Not answered
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-start gap-1.5">
                        <span className="shrink-0 font-medium text-primary">
                          {partnerAvatar} {partnerName}:
                        </span>
                        {isAllBothAnswered ? (
                          <span className="min-w-0 flex-1 break-words text-foreground/90">
                            {partnerChoice}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Locked until {partnerName} finishes 🔒
                          </span>
                        )}
                      </div>
                    </div>
                  </CustomItem>
                )
              })}
              <div ref={todaySentinelRef} className="h-1" />
            </div>
          </>
        )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
        {sortedHistoryQuizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <History className="size-8 opacity-40" />
            <p className="text-[11px]">No answered quizzes yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visibleHistoryQuizzes.map((entry) => {
              const qContent = entry.quiz.content
              if (!qContent) return null
              const myChoice = entry.myAnswer?.content?.selectedOption
              const partnerChoice = entry.partnerAnswer?.content?.selectedOption
              const tag = qContent.tags?.[0]

              return (
                <CustomItem
                  key={entry.quiz.id}
                  variant="outline"
                  className="gap-1.5 rounded-2xl p-3 transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_132px]"
                  icon={<Sparkles className="size-4 text-violet-500" />}
                  title={`${myAvatar}${partnerAvatar} Daily Quiz`}
                  topRightActions={
                    <span className="text-[10px] whitespace-nowrap text-primary/75">
                      {formatQuizTime(entry.latestAnsweredAt)}
                    </span>
                  }
                  contentClassName="space-y-1.5 pl-6"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tag && (
                      <span className="py-0.2 shrink-0 rounded bg-muted/70 px-1.5 text-[10px] font-medium text-muted-foreground">
                        #{tag}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 gap-1 px-1.5 py-0 text-[10px] font-normal",
                        entry.isMatched
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      <HelpCircle className="size-2.5 text-primary" />
                      {entry.isMatched ? "Match ✨" : "Diff 💬"}
                    </Badge>
                  </div>

                  <p className="text-[11px] leading-snug font-medium break-words text-foreground">
                    {qContent.question}
                  </p>

                  <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/20 p-2 pt-1.5 text-[11px]">
                    <div className="flex min-w-0 items-start gap-1.5">
                      <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
                        <span>{myAvatar}</span> You:
                      </span>
                      <span className="flex-1 leading-snug font-medium break-words text-foreground/90">
                        {myChoice || (
                          <span className="font-normal text-muted-foreground italic">
                            Not answered yet
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-start gap-1.5">
                      <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
                        <span>{partnerAvatar}</span> {partnerName}:
                      </span>
                      {entry.isBothAnswered ? (
                        <span className="flex-1 leading-snug font-medium break-words text-foreground/90">
                          {partnerChoice}
                        </span>
                      ) : (
                        <span className="leading-snug font-normal text-muted-foreground italic">
                          Locked until both answer 🔒
                        </span>
                      )}
                    </div>
                  </div>
                </CustomItem>
              )
            })}
            <div ref={historySentinelRef} className="h-1" />
          </div>
        )}
        </div>
      )}
    </section>
  )
}

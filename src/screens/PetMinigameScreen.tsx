import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useParams } from "wouter"
import {
  FlappyPetGame,
  FruitCatcherGame,
  ZumaGame,
} from "@/components/pet/minigames"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePet } from "@/hooks/usePet"
import { PET_MINIGAMES } from "@/lib/petConfig"
import { canPetPlay } from "@/lib/petLogic"
import type { PetMinigameId } from "@/types/pet"

function isPetMinigameId(value: string | undefined): value is PetMinigameId {
  return Boolean(value && value in PET_MINIGAMES)
}

export function PetMinigameScreen() {
  const { t } = useTranslation("space")
  const { gameId } = useParams<{ gameId?: string }>()
  const [, navigate] = useLocation()
  const { pet, content, isLoading, completeMinigame, isUpdating } = usePet()

  const [sessionKey, setSessionKey] = useState(1)
  const [result, setResult] = useState<{
    score: number
    earnedXp: number
    happinessDelta: number
    energyDelta: number
    hungerDelta: number
    isNewBest: boolean
    bestScore: number
  } | null>(null)

  const validGameId: PetMinigameId | null = isPetMinigameId(gameId)
    ? gameId
    : null

  const liveScoreRef = useRef(0)
  const submittedRef = useRef(false)
  const latestGameIdRef = useRef<PetMinigameId | null>(validGameId)
  const latestCompleteRef = useRef(completeMinigame)

  useEffect(() => {
    latestGameIdRef.current = validGameId
  }, [validGameId])

  useEffect(() => {
    latestCompleteRef.current = completeMinigame
  }, [completeMinigame])

  // If the user navigates away mid-game (Header Back / BottomNav) after scoring,
  // still persist their XP, stat deltas, and best score.
  useEffect(() => {
    return () => {
      const activeGameId = latestGameIdRef.current
      if (
        !submittedRef.current &&
        liveScoreRef.current > 0 &&
        activeGameId
      ) {
        submittedRef.current = true
        void latestCompleteRef.current(activeGameId, liveScoreRef.current)
      }
    }
  }, [])

  const handleScoreChange = useCallback((score: number) => {
    liveScoreRef.current = score
  }, [])

  const handleFinish = useCallback(
    async (score: number) => {
      if (!validGameId || submittedRef.current) return
      submittedRef.current = true
      liveScoreRef.current = score
      const reward = await completeMinigame(validGameId, score)
      setResult({
        score,
        earnedXp: reward?.earnedXp ?? 0,
        happinessDelta: reward?.statDeltas.happiness ?? 0,
        energyDelta: reward?.statDeltas.energy ?? 0,
        hungerDelta: reward?.statDeltas.hunger ?? 0,
        isNewBest: reward?.isNewBest ?? false,
        bestScore: reward?.bestScore ?? score,
      })
    },
    [validGameId, completeMinigame]
  )

  const handleLeave = useCallback(
    (score: number) => {
      if (score > 0) {
        void handleFinish(score)
      } else {
        submittedRef.current = true
        navigate("/space/virtual-pets")
      }
    },
    [handleFinish, navigate]
  )

  const handlePlayAgain = () => {
    submittedRef.current = false
    liveScoreRef.current = 0
    setResult(null)
    setSessionKey((k) => k + 1)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-4">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-[60svh] w-full rounded-3xl" />
      </div>
    )
  }

  if (
    !pet ||
    !validGameId ||
    (!result && (content.isSleeping || !canPetPlay(content)))
  ) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t("pet.minigames.unavailable")}
        </p>
        <Button onClick={() => navigate("/space/virtual-pets")}>
          {t("pet.minigames.backToPet")}
        </Button>
      </div>
    )
  }

  const game = PET_MINIGAMES[validGameId]

  return (
    <div className="relative flex h-full min-h-[calc(100svh-3rem)] w-full flex-1 flex-col overflow-hidden md:min-h-0">
      {result ? (
        <div className="flex flex-1 items-center justify-center p-4 pb-20">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/90 p-6 text-center shadow-lg backdrop-blur-md">
            <div className="text-4xl">{game.icon}</div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-bold">
                  {t("pet.minigames.finishedTitle")}
                </h3>
                {result.isNewBest && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    🏆 {t("pet.minigames.newBest")}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("pet.minigames.finalScore", { score: result.score })} · 🏆{" "}
                {result.bestScore}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                +{result.earnedXp} XP
              </span>
              {result.happinessDelta !== 0 && (
                <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300">
                  💛{" "}
                  {result.happinessDelta > 0
                    ? `+${result.happinessDelta}`
                    : result.happinessDelta}
                </span>
              )}
              {result.energyDelta !== 0 && (
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  ⚡{" "}
                  {result.energyDelta > 0
                    ? `+${result.energyDelta}`
                    : result.energyDelta}
                </span>
              )}
              {result.hungerDelta !== 0 && (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  🍎{" "}
                  {result.hungerDelta > 0
                    ? `+${result.hungerDelta}`
                    : result.hungerDelta}
                </span>
              )}
            </div>

            <div className="flex w-full gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl"
                disabled={isUpdating}
                onClick={() => navigate("/space/virtual-pets")}
              >
                {t("pet.minigames.backToPet")}
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-2xl"
                disabled={isUpdating}
                onClick={handlePlayAgain}
              >
                {t("pet.minigames.playAgain")}
              </Button>
            </div>
          </div>
        </div>
      ) : validGameId === "fruit-catcher" ? (
        <FruitCatcherGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
          onLeave={handleLeave}
          onScoreChange={handleScoreChange}
        />
      ) : validGameId === "zuma" ? (
        <ZumaGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
          onLeave={handleLeave}
          onScoreChange={handleScoreChange}
        />
      ) : (
        <FlappyPetGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
          onLeave={handleLeave}
          onScoreChange={handleScoreChange}
        />
      )}
    </div>
  )
}

import { useCallback, useState } from "react"
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
  } | null>(null)

  const validGameId: PetMinigameId | null = isPetMinigameId(gameId)
    ? gameId
    : null

  const handleFinish = useCallback(
    async (score: number) => {
      if (!validGameId) return
      const reward = await completeMinigame(validGameId, score)
      setResult({
        score,
        earnedXp: reward?.earnedXp ?? 0,
        happinessDelta: reward?.statDeltas.happiness ?? 0,
      })
    },
    [validGameId, completeMinigame]
  )

  const handlePlayAgain = () => {
    setResult(null)
    setSessionKey((k) => k + 1)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-4">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    )
  }

  if (!pet || !validGameId || (!result && (content.isSleeping || !canPetPlay(content)))) {
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 p-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.icon}</span>
          <h2 className="text-base font-semibold">
            {t(`pet.minigames.items.${validGameId}.title`)}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">{pet.name}</span>
      </div>

      {result ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 text-center">
          <div className="text-4xl">{game.icon}</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">
              {t("pet.minigames.finishedTitle")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("pet.minigames.finalScore", { score: result.score })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              +{result.earnedXp} XP
            </span>
            {result.happinessDelta > 0 && (
              <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300">
                💛 +{result.happinessDelta}
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
      ) : validGameId === "fruit-catcher" ? (
        <FruitCatcherGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
        />
      ) : validGameId === "zuma" ? (
        <ZumaGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
        />
      ) : (
        <FlappyPetGame
          key={sessionKey}
          avatarSeed={pet.unique_name}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}

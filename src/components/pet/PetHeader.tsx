import { useState } from "react"
import { Check, Pencil, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PET_PROFILE_CONFIG } from "@/lib/petConfig"
import { getPetLevelProgress } from "@/lib/petLogic"
import { cn } from "@/lib/utils"

interface PetHeaderProps {
  name: string
  xp: number
  onRename: (name: string) => Promise<void>
  isUpdating: boolean
  embedded?: boolean
  className?: string
}

export function PetHeader({
  name,
  xp,
  onRename,
  isUpdating,
  embedded = false,
  className,
}: PetHeaderProps) {
  const { t } = useTranslation("space")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const { level, totalXp, nextLevelXp, isMaxLevel } = getPetLevelProgress(xp)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    await onRename(trimmed)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        !embedded &&
          "rounded-2xl border border-border/60 bg-card/80 px-3.5 py-2.5 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="flex flex-1 items-center gap-1"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={PET_PROFILE_CONFIG.nameMaxLength}
            className="h-7 rounded-lg text-xs"
            autoFocus
            disabled={isUpdating}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="size-7 rounded-lg"
            disabled={!draft.trim() || isUpdating}
          >
            <Check className="size-3.5 text-emerald-600" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 rounded-lg"
            onClick={() => {
              setDraft(name)
              setIsEditing(false)
            }}
          >
            <X className="size-3.5 text-muted-foreground" />
          </Button>
        </form>
      ) : (
        <div className="flex min-w-0 items-center gap-1">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {name}
          </h2>
          <button
            type="button"
            onClick={() => {
              setDraft(name)
              setIsEditing(true)
            }}
            aria-label={t("pet.rename")}
            className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3" />
          </button>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {t("pet.level", { level })}
        </span>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {isMaxLevel ? `${totalXp} XP · MAX` : `${totalXp}/${nextLevelXp} XP`}
        </span>
      </div>
    </div>
  )
}

import { useState } from "react"
import { Check, Pencil, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PET_LEVEL_CONFIG, PET_PROFILE_CONFIG } from "@/lib/petConfig"
import { getXpForLevel } from "@/lib/petLogic"
import { cn } from "@/lib/utils"

interface PetHeaderProps {
  name: string
  level: number
  xp: number
  onRename: (name: string) => Promise<void>
  isUpdating: boolean
  className?: string
}

export function PetHeader({
  name,
  level,
  xp,
  onRename,
  isUpdating,
  className,
}: PetHeaderProps) {
  const { t } = useTranslation("space")
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)

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
        "flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-md",
        className
      )}
    >
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="flex flex-1 items-center gap-1.5"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={PET_PROFILE_CONFIG.nameMaxLength}
            className="h-8 rounded-xl text-sm"
            autoFocus
            disabled={isUpdating}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl"
            disabled={!draft.trim() || isUpdating}
          >
            <Check className="size-4 text-emerald-600" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl"
            onClick={() => {
              setDraft(name)
              setIsEditing(false)
            }}
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </form>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="truncate text-base font-semibold text-foreground">
            {name}
          </h2>
          <button
            type="button"
            onClick={() => {
              setDraft(name)
              setIsEditing(true)
            }}
            aria-label={t("pet.rename")}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {t("pet.level", { level })}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {PET_LEVEL_CONFIG.maxLevel !== null &&
          level >= PET_LEVEL_CONFIG.maxLevel
            ? "MAX"
            : `${xp}/${getXpForLevel(level)} XP`}
        </span>
      </div>
    </div>
  )
}

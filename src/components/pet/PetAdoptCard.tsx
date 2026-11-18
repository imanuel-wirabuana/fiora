import { useState } from "react"
import { Blobatar } from "@blobatar/react"
import { happy } from "blobatar/expression"
import "blobatar/motion.css"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PetAdoptCardProps {
  onAdopt: (name: string) => Promise<unknown>
  isAdopting: boolean
}

export function PetAdoptCard({ onAdopt, isAdopting }: PetAdoptCardProps) {
  const { t } = useTranslation("space")
  const [name, setName] = useState("")

  const previewSeed = name.trim() || "fiora-pet"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isAdopting) return
    await onAdopt(name.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 text-center shadow-sm"
    >
      <div className="flex size-32 items-center justify-center rounded-full bg-primary/10">
        <Blobatar
          name={previewSeed}
          size={104}
          expression={happy}
          animate="always"
        />
      </div>

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          {t("pet.adopt.title")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("pet.adopt.description")}
        </p>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("pet.adopt.placeholder")}
        maxLength={24}
        className="rounded-2xl text-center"
        disabled={isAdopting}
      />

      <Button
        type="submit"
        disabled={!name.trim() || isAdopting}
        className="w-full rounded-2xl"
      >
        <Sparkles className="mr-1.5 size-4" />
        {isAdopting ? t("pet.adopt.adopting") : t("pet.adopt.button")}
      </Button>
    </form>
  )
}

import { cn } from "@/lib/utils"
import type { Gender } from "@/types/relationship"

interface GenderStepProps {
  gender: Gender | null
  onSelectGender: (gender: Gender) => void
}

export function GenderStep({ gender, onSelectGender }: GenderStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">Who are you?</h3>
        <p className="text-xs text-muted-foreground">
          Select your gender so we can personalize the experience
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* Male */}
        <button
          type="button"
          onClick={() => onSelectGender("male")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-6 transition-all active:scale-[0.98]",
            gender === "male"
              ? "border-primary bg-primary/10 shadow-xs"
              : "border-border hover:bg-muted/40"
          )}
        >
          <span className="text-4xl" role="img" aria-label="Male">
            🙋‍♂️
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              gender === "male" ? "text-primary" : "text-foreground"
            )}
          >
            Male
          </span>
        </button>

        {/* Female */}
        <button
          type="button"
          onClick={() => onSelectGender("female")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-6 transition-all active:scale-[0.98]",
            gender === "female"
              ? "border-primary bg-primary/10 shadow-xs"
              : "border-border hover:bg-muted/40"
          )}
        >
          <span className="text-4xl" role="img" aria-label="Female">
            🙋‍♀️
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              gender === "female" ? "text-primary" : "text-foreground"
            )}
          >
            Female
          </span>
        </button>
      </div>
    </div>
  )
}


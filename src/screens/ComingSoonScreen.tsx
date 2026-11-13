import { Sparkles } from "lucide-react"

interface ComingSoonScreenProps {
  title?: string
  description?: string
}

export function ComingSoonScreen({
  title = "Coming Soon",
  description = "This feature is currently under development. Stay tuned!",
}: ComingSoonScreenProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  )
}


import { Brand } from "@/components/Brand"

export function AuthHeroSection() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-4 text-primary-foreground">
      <Brand size="lg" align="center" subtitle="Mood tracker for couples" />
    </div>
  )
}


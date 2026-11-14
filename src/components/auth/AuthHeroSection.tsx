import { Brand } from "@/components/Brand"

export function AuthHeroSection() {
  return (
    <div className="relative flex shrink-0 flex-col items-center justify-center px-6 pt-9 pb-2 text-primary-foreground">
      <Brand
        showLogo
        logoVariant="glass"
        size="lg"
        align="center"
        subtitle="Mood tracker for couples"
      />
    </div>
  )
}

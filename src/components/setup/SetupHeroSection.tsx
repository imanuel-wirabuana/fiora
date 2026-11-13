import { Brand } from "@/components/Brand"

export function SetupHeroSection() {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-10 pb-4 text-primary-foreground">
      <Brand size="default" align="center" subtitle="Let's set up your relationship" />
    </div>
  )
}


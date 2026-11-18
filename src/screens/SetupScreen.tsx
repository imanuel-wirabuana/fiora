import { SetupHeroSection, SetupStepperSection } from "@/components/setup"

export function SetupScreen() {
  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col overflow-hidden bg-primary md:h-full md:min-h-0 md:overflow-x-hidden md:overflow-y-auto">
      <SetupHeroSection />
      <SetupStepperSection />
    </div>
  )
}

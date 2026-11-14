import {
  AuthFormSection,
  AuthHeroSection,
  type AuthTab,
} from "@/components/auth"

interface AuthScreenProps {
  defaultTab?: AuthTab
}

export function AuthScreen({ defaultTab = "login" }: AuthScreenProps) {
  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col overflow-hidden bg-primary lg:min-h-full">
      {/* Subtle atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl"
      />
      <AuthHeroSection />
      <AuthFormSection defaultTab={defaultTab} />
    </div>
  )
}

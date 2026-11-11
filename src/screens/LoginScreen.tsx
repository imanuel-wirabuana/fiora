import { AuthHeroSection, LoginFormSection } from "@/components/auth"

export function LoginScreen() {
  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-primary lg:min-h-full">
      <AuthHeroSection />
      <LoginFormSection />
    </div>
  )
}

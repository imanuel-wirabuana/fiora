import { AuthHeroSection, RegisterFormSection } from "@/components/auth"

export function RegisterScreen() {
  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-primary lg:min-h-full">
      <AuthHeroSection />
      <RegisterFormSection />
    </div>
  )
}

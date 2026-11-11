import { useState } from "react"
import { useLocation } from "wouter"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { Brand } from "../components/Brand"
import { Button } from "../components/ui/button"
import { Field, FieldError, FieldLabel } from "../components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../components/ui/input-group"
import { Spinner } from "../components/ui/spinner"
import { useAuth } from "../hooks/useAuth"

export function LoginScreen() {
  const [, setLocation] = useLocation()
  const { signInMutation } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage = signInMutation.error?.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    signInMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          setLocation("/home")
        },
      }
    )
  }

  const handleInputChange = () => {
    if (signInMutation.error) {
      signInMutation.reset()
    }
  }

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-primary lg:min-h-full">
      {/* Top / Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-4 text-primary-foreground">
        <Brand size="lg" align="center" subtitle="Mood tracker for couples" />
      </div>

      {/* Persistent Bottom Drawer Sheet */}
      <div className="w-full shrink-0 rounded-t-4xl border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Welcome back</h2>
          <p className="text-xs text-muted-foreground">
            Sign in to sync moments with your partner
          </p>
        </div>

        {/* Login Form inside Drawer */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field className="gap-1.5" data-invalid={!!errorMessage}>
            <FieldLabel htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email address
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <InputGroupAddon align="inline-start" className="text-muted-foreground/60 pl-3">
                <Mail className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                aria-invalid={!!errorMessage}
                onChange={(e) => {
                  setEmail(e.target.value)
                  handleInputChange()
                }}
                className="text-sm placeholder:text-muted-foreground/60"
              />
            </InputGroup>
          </Field>

          <Field className="gap-1.5" data-invalid={!!errorMessage}>
            <FieldLabel htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <InputGroupAddon align="inline-start" className="text-muted-foreground/60 pl-3">
                <Lock className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                aria-invalid={!!errorMessage}
                onChange={(e) => {
                  setPassword(e.target.value)
                  handleInputChange()
                }}
                className="text-sm placeholder:text-muted-foreground/60"
              />
              <InputGroupAddon align="inline-end" className="pr-1.5">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="size-7 rounded-xl text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          <Button
            type="submit"
            disabled={signInMutation.isPending}
            className="mt-2 h-10 w-full rounded-2xl bg-primary font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.99]"
          >
            {signInMutation.isPending ? <Spinner className="size-4" /> : "Sign In"}
          </Button>
        </form>

        {/* Drawer Footer */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <span>Connecting for the first time? </span>
          <button
            type="button"
            onClick={() => setLocation("/register")}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  )
}

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

export function RegisterScreen() {
  const [, setLocation] = useLocation()
  const { signUpMutation } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const errorMessage = localError || signUpMutation.error?.message

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setInfoMessage(null)

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    signUpMutation.mutate(
      { email, password },
      {
        onSuccess: (result) => {
          if (result.requiresEmailConfirmation) {
            setInfoMessage(
              "Registration successful! Please check your email inbox to confirm your account before signing in."
            )
          } else {
            setLocation("/setup")
          }
        },
      }
    )
  }

  const handleInputChange = () => {
    if (localError) setLocalError(null)
    if (signUpMutation.error) signUpMutation.reset()
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
          <h2 className="text-lg font-semibold tracking-tight">
            Create an account
          </h2>
          <p className="text-xs text-muted-foreground">
            Sign up to start syncing moments with your partner
          </p>
        </div>

        {/* Register Form inside Drawer */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor="register-email"
              className="text-xs font-medium text-muted-foreground"
            >
              Email address
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <InputGroupAddon align="inline-start" className="text-muted-foreground/60 pl-3">
                <Mail className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="register-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  handleInputChange()
                }}
                className="text-sm placeholder:text-muted-foreground/60"
              />
            </InputGroup>
          </Field>

          <Field className="gap-1.5" data-invalid={!!errorMessage}>
            <FieldLabel
              htmlFor="register-password"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <InputGroupAddon align="inline-start" className="text-muted-foreground/60 pl-3">
                <Lock className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="register-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
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

          <Field className="gap-1.5" data-invalid={!!errorMessage}>
            <FieldLabel
              htmlFor="register-confirm-password"
              className="text-xs font-medium text-muted-foreground"
            >
              Confirm password
            </FieldLabel>
            <InputGroup className="h-10 rounded-2xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <InputGroupAddon align="inline-start" className="text-muted-foreground/60 pl-3">
                <Lock className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                aria-invalid={!!errorMessage}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  handleInputChange()
                }}
                className="text-sm placeholder:text-muted-foreground/60"
              />
              <InputGroupAddon align="inline-end" className="pr-1.5">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="size-7 rounded-xl text-muted-foreground/60 hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          {infoMessage && (
            <p className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-xs text-primary font-medium">
              {infoMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={signUpMutation.isPending}
            className="mt-1 h-10 w-full rounded-2xl bg-primary font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.99]"
          >
            {signUpMutation.isPending ? <Spinner className="size-4" /> : "Register"}
          </Button>
        </form>

        {/* Drawer Footer */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

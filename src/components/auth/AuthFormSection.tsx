import { useEffect, useRef, useState } from "react"
import { useLocation } from "wouter"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  UserPlus,
} from "lucide-react"
import { AnimatedEmoji } from "@/components/AnimatedEmoji"
import { CustomTabs } from "@/components/CustomTabs"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export type AuthTab = "login" | "register"

interface AuthFormSectionProps {
  defaultTab?: AuthTab
}

export function AuthFormSection({
  defaultTab = "login",
}: AuthFormSectionProps) {
  const [, setLocation] = useLocation()
  const { signInMutation, signUpMutation } = useAuth()

  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined
  )

  const isLogin = activeTab === "login"
  const isPending = isLogin
    ? signInMutation.isPending
    : signUpMutation.isPending

  const errorMessage =
    localError ||
    (isLogin ? signInMutation.error?.message : signUpMutation.error?.message)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const updateHeight = () => {
      setContentHeight(el.scrollHeight)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeTab, errorMessage, infoMessage])

  const handleTabChange = (nextTab: string) => {
    const tab = nextTab as AuthTab
    if (tab === activeTab) return
    setActiveTab(tab)
    setLocalError(null)
    setInfoMessage(null)
    setConfirmPassword("")
    signInMutation.reset()
    signUpMutation.reset()
  }

  const handleInputChange = () => {
    if (localError) setLocalError(null)
    if (infoMessage) setInfoMessage(null)
    if (signInMutation.error) signInMutation.reset()
    if (signUpMutation.error) signUpMutation.reset()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setInfoMessage(null)

    if (isLogin) {
      signInMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            setLocation("/home")
          },
        }
      )
      return
    }

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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col justify-between">
      {/* Outside Drawer: Vertically Balanced Welcome Header */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-4 text-center text-primary-foreground">
        <div
          key={activeTab}
          className={cn(
            "flex flex-col items-center gap-2 rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 px-6 py-4 backdrop-blur-xs animate-in fade-in duration-250",
            isLogin ? "slide-in-from-left-3" : "slide-in-from-right-3"
          )}
        >
          <AnimatedEmoji
            emoji={isLogin ? "🥰" : "✨"}
            size={32}
            replayOnTap={false}
            fallbackClassName="text-2xl"
          />
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create your space"}
            </h2>
            <p className="text-xs leading-relaxed text-primary-foreground/85">
              {isLogin
                ? "Sign in to sync moments with your partner"
                : "Sign up to start sharing moods, nudges, and memories"}
            </p>
          </div>
        </div>
      </div>

      {/* Inside Drawer: CustomTabs + Smooth Expanding Form */}
      <div className="flex w-full shrink-0 flex-col rounded-t-4xl border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl">
        <CustomTabs
          items={[
            {
              value: "login",
              label: "Sign In",
              icon: <LogIn className="size-3.5" />,
              disabled: isPending,
            },
            {
              value: "register",
              label: "Register",
              icon: <UserPlus className="size-3.5" />,
              disabled: isPending,
            },
          ]}
          value={activeTab}
          onValueChange={handleTabChange}
          className="mb-4"
        />

        <div
          style={{
            height: contentHeight !== undefined ? `${contentHeight}px` : "auto",
          }}
          className="overflow-hidden transition-[height] duration-300 ease-out"
        >
          <div ref={contentRef}>
            <form
              key={activeTab}
              onSubmit={handleSubmit}
              className={cn(
                "space-y-3.5 px-0.5 py-0.5 animate-in fade-in duration-250",
                isLogin ? "slide-in-from-left-3" : "slide-in-from-right-3"
              )}
            >
              <Field className="gap-1.5" data-invalid={!!errorMessage}>
                <FieldLabel
                  htmlFor="auth-email"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email address
                </FieldLabel>
                <InputGroup className="h-11 overflow-hidden rounded-2xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <InputGroupAddon
                    align="inline-start"
                    className="pl-3 text-muted-foreground/60"
                  >
                    <Mail className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="auth-email"
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
                <FieldLabel
                  htmlFor="auth-password"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Password
                </FieldLabel>
                <InputGroup className="h-11 overflow-hidden rounded-2xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <InputGroupAddon
                    align="inline-start"
                    className="pl-3 text-muted-foreground/60"
                  >
                    <Lock className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isLogin ? undefined : 6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder={
                      isLogin ? "••••••••" : "At least 6 characters"
                    }
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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

              {!isLogin && (
                <Field className="gap-1.5" data-invalid={!!errorMessage}>
                  <FieldLabel
                    htmlFor="auth-confirm-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Confirm password
                  </FieldLabel>
                  <InputGroup className="h-11 overflow-hidden rounded-2xl border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <InputGroupAddon
                      align="inline-start"
                      className="pl-3 text-muted-foreground/60"
                    >
                      <Lock className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="auth-confirm-password"
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
              )}

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {infoMessage && (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="mt-1 h-11 w-full rounded-2xl bg-primary text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.99]"
              >
                {isPending ? (
                  <Spinner className="size-4" />
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


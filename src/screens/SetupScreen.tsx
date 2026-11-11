import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Brand } from "@/components/Brand"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import {
  SETUP_STEPS,
  initialWizardState,
  type SetupWizardState,
} from "@/components/setup/setupSteps"
import { useRelationship } from "@/hooks/useRelationship"

export function SetupScreen() {
  const [, setLocation] = useLocation()
  const { createRelationshipMutation, joinRelationshipMutation } = useRelationship()

  // Dynamic wizard state
  const [wizardState, setWizardState] = useState<SetupWizardState>(initialWizardState)
  const [error, setError] = useState<string | null>(null)

  // Compute active (visible) steps based on dynamic condition rules
  const activeSteps = useMemo(() => {
    return SETUP_STEPS.filter((step) => !step.isVisible || step.isVisible(wizardState))
  }, [wizardState])

  // Track active step by ID (defaults to first active step)
  const [activeStepId, setActiveStepId] = useState<string>(() => SETUP_STEPS[0].id)

  // Resolve current active step index and config
  const currentIndex = useMemo(() => {
    const idx = activeSteps.findIndex((s) => s.id === activeStepId)
    return idx >= 0 ? idx : 0
  }, [activeSteps, activeStepId])

  const currentStep = activeSteps[currentIndex] || activeSteps[0]
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === activeSteps.length - 1

  // Generic state updater
  const updateWizardState = (updates: Partial<SetupWizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }))
  }

  const isSubmitting =
    createRelationshipMutation.isPending || joinRelationshipMutation.isPending

  // Navigation handlers
  const handleNext = () => {
    setError(null)

    // Execute step validation rule if defined
    if (currentStep.validate) {
      const validationError = currentStep.validate(wizardState)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (!isLastStep) {
      const nextStep = activeSteps[currentIndex + 1]
      setActiveStepId(nextStep.id)
    }
  }

  const handleBack = () => {
    setError(null)
    if (!isFirstStep) {
      const prevStep = activeSteps[currentIndex - 1]
      setActiveStepId(prevStep.id)
    }
  }

  const handleFinish = async () => {
    setError(null)

    // Run current step validation before finishing
    if (currentStep.validate) {
      const validationError = currentStep.validate(wizardState)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (!wizardState.gender) {
      setError("Please select your gender.")
      setActiveStepId("gender")
      return
    }

    if (!wizardState.name.trim()) {
      setError("Please enter your name or nickname.")
      setActiveStepId("profile")
      return
    }

    try {
      if (wizardState.connectionType === "create") {
        await createRelationshipMutation.mutateAsync({
          gender: wizardState.gender,
          name: wizardState.name.trim(),
          avatar: wizardState.avatar,
          anniversary: wizardState.anniversary,
          moods: wizardState.moods,
          nudges: wizardState.nudges,
          inviteCode: wizardState.inviteCode,
        })
        setLocation("/home")
      } else {
        if (wizardState.partnerCode.trim().length !== 5) {
          setError("Please enter a valid 5-digit partner code.")
          return
        }
        await joinRelationshipMutation.mutateAsync({
          gender: wizardState.gender,
          name: wizardState.name.trim(),
          avatar: wizardState.avatar,
          inviteCode: wizardState.partnerCode.trim(),
        })
        setLocation("/home")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to complete setup. Please try again.")
      }
    }
  }

  const progressPercent = ((currentIndex + 1) / activeSteps.length) * 100

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-primary lg:min-h-full">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-4 text-primary-foreground">
        <Brand size="default" align="center" subtitle="Let's set up your couple space" />
      </div>

      {/* Persistent Bottom Stepper Card */}
      <div className="flex max-h-[82svh] w-full shrink-0 flex-col rounded-t-4xl border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl">
        {/* Dynamic Progress & Step Indicator */}
        <div className="mb-3 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              Step {currentIndex + 1} of {activeSteps.length}
            </span>
            <span>{currentStep.title}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5 w-full bg-muted" />
        </div>

        {/* Dynamic Step Content - Scrollable on overflow */}
        <div className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1.5 overscroll-contain">
          {currentStep.render({
            state: wizardState,
            updateState: updateWizardState,
            error,
            setError,
          })}
        </div>

        {/* General step error message */}
        {error && currentStep.id !== "connection" && (
          <p className="shrink-0 pt-2 text-center text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Navigation Actions - Pinned at bottom */}
        <div className="shrink-0 pt-3 border-t border-border/40 mt-1 flex items-center gap-3">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="h-11 rounded-2xl flex-1 text-xs"
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
          )}

          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-11 rounded-2xl flex-1 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ArrowRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="h-11 rounded-2xl flex-1 bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  Finish Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

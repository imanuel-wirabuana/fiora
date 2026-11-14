import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "wouter"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { useRelationship } from "@/hooks/useRelationship"
import { cn } from "@/lib/utils"
import {
  SETUP_STEPS,
  initialWizardState,
  type SetupWizardState,
} from "./setupSteps"

export function SetupStepperSection() {
  const [, setLocation] = useLocation()
  const { createRelationshipMutation, joinRelationshipMutation } =
    useRelationship()

  // Dynamic wizard state
  const [wizardState, setWizardState] =
    useState<SetupWizardState>(initialWizardState)
  const [error, setError] = useState<string | null>(null)
  const [navDirection, setNavDirection] = useState<"next" | "back">("next")

  // Compute active (visible) steps based on dynamic condition rules
  const activeSteps = useMemo(() => {
    return SETUP_STEPS.filter(
      (step) => !step.isVisible || step.isVisible(wizardState)
    )
  }, [wizardState])

  // Track active step by ID (defaults to first active step)
  const [activeStepId, setActiveStepId] = useState<string>(
    () => SETUP_STEPS[0].id
  )

  // Resolve current active step index and config
  const currentIndex = useMemo(() => {
    const idx = activeSteps.findIndex((s) => s.id === activeStepId)
    return idx >= 0 ? idx : 0
  }, [activeSteps, activeStepId])

  const currentStep = activeSteps[currentIndex] || activeSteps[0]
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === activeSteps.length - 1

  // Measure active step content height for smooth drawer expand/collapse
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined
  )

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
  }, [currentStep.id])

  // Generic state updater
  const updateWizardState = (updates: Partial<SetupWizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }))
  }

  const isSubmitting =
    createRelationshipMutation.isPending || joinRelationshipMutation.isPending

  // Navigation handlers
  const handleNext = () => {
    setError(null)

    if (currentStep.validate) {
      const validationError = currentStep.validate(wizardState)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (!isLastStep) {
      const nextStep = activeSteps[currentIndex + 1]
      setNavDirection("next")
      setActiveStepId(nextStep.id)
    }
  }

  const handleBack = () => {
    setError(null)
    if (!isFirstStep) {
      const prevStep = activeSteps[currentIndex - 1]
      setNavDirection("back")
      setActiveStepId(prevStep.id)
    }
  }

  const handleFinish = async () => {
    setError(null)

    if (currentStep.validate) {
      const validationError = currentStep.validate(wizardState)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (!wizardState.gender) {
      setError("Please select your gender.")
      setNavDirection("back")
      setActiveStepId("gender")
      return
    }

    if (!wizardState.name.trim()) {
      setError("Please enter your name or nickname.")
      setNavDirection("back")
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
    <div className="flex min-h-0 flex-1 flex-col justify-between">
      {/* Outside Drawer: Progress Bar + Step Question */}
      <div className="flex shrink-0 flex-col gap-4 px-6 pt-2 pb-5 text-primary-foreground">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-primary-foreground/85">
            <span>
              Step {currentIndex + 1} of {activeSteps.length}
            </span>
            <span>{currentStep.title}</span>
          </div>
          <Progress
            value={progressPercent}
            className="w-full [&_[data-slot=progress-indicator]]:bg-primary-foreground [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-primary-foreground/20"
          />
        </div>

        <div
          key={currentStep.id}
          className={cn(
            "space-y-1 animate-in fade-in duration-250",
            navDirection === "next"
              ? "slide-in-from-right-3"
              : "slide-in-from-left-3"
          )}
        >
          <h2 className="text-xl font-bold tracking-tight">
            {currentStep.question}
          </h2>
          <p className="text-xs leading-relaxed text-primary-foreground/80">
            {currentStep.description}
          </p>
        </div>
      </div>

      {/* Inside Drawer: User Interactions Only + Smooth Height Expand/Collapse */}
      <div className="flex w-full shrink-0 flex-col rounded-t-4xl border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl">
        <div
          style={{
            height: contentHeight !== undefined ? `${contentHeight}px` : "auto",
          }}
          className="max-h-[54svh] overflow-x-hidden overflow-y-auto overscroll-contain transition-[height] duration-300 ease-out"
        >
          <div ref={contentRef} className="px-0.5 py-1">
            <div
              key={currentStep.id}
              className={cn(
                "animate-in fade-in duration-250",
                navDirection === "next"
                  ? "slide-in-from-right-3"
                  : "slide-in-from-left-3"
              )}
            >
              {currentStep.render({
                state: wizardState,
                updateState: updateWizardState,
                error,
                setError,
              })}
            </div>
          </div>
        </div>

        {/* General step error message */}
        {error && currentStep.id !== "connection" && (
          <p className="shrink-0 pt-2 text-center text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Navigation Actions - Pinned at bottom */}
        <div className="mt-2 flex shrink-0 items-center gap-3 border-t border-border/40 pt-3">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-2xl text-xs"
            >
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Button>
          )}

          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-11 flex-1 rounded-2xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ArrowRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-2xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <Check className="mr-1 size-4" />
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

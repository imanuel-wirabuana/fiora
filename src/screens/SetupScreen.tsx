import { useState } from "react"
import { useLocation } from "wouter"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Brand } from "@/components/Brand"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { GenderStep } from "@/components/setup/GenderStep"
import { MoodsStep } from "@/components/setup/MoodsStep"
import { InviteCodeStep } from "@/components/setup/InviteCodeStep"
import { useRelationship } from "@/hooks/useRelationship"
import { DEFAULT_MOOD_OPTIONS, generateInviteCode } from "@/lib/relationship"
import type { Gender, MoodOption } from "@/types/relationship"

export function SetupScreen() {
  const [, setLocation] = useLocation()
  const { createRelationshipMutation, joinRelationshipMutation } = useRelationship()

  // Stepper state (1: Gender, 2: Moods, 3: Invite Code)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [gender, setGender] = useState<Gender | null>(null)
  const [moods, setMoods] = useState<MoodOption[]>(DEFAULT_MOOD_OPTIONS)
  const [inviteCode, setInviteCode] = useState<string>(() => generateInviteCode())
  const [partnerCode, setPartnerCode] = useState<string>("")
  const [tab, setTab] = useState<"create" | "join">("create")
  const [error, setError] = useState<string | null>(null)

  const isSubmitting =
    createRelationshipMutation.isPending || joinRelationshipMutation.isPending

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!gender) {
        setError("Please select your gender to continue.")
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === 3) setStep(2)
    else if (step === 2) setStep(1)
  }

  const handleFinish = async () => {
    setError(null)
    if (!gender) {
      setError("Please select your gender.")
      setStep(1)
      return
    }

    try {
      if (tab === "create") {
        await createRelationshipMutation.mutateAsync({
          gender,
          moods,
          inviteCode,
        })
        setLocation("/home")
      } else {
        if (partnerCode.trim().length !== 5) {
          setError("Please enter a valid 5-digit partner code.")
          return
        }
        await joinRelationshipMutation.mutateAsync({
          gender,
          inviteCode: partnerCode.trim(),
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

  const progressPercent = (step / 3) * 100

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col justify-between overflow-hidden bg-primary lg:min-h-full">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-4 text-primary-foreground">
        <Brand size="default" align="center" subtitle="Let's set up your couple space" />
      </div>

      {/* Persistent Bottom Stepper Card */}
      <div className="w-full shrink-0 rounded-t-4xl border-t border-border bg-card px-6 pt-5 pb-6 shadow-2xl">
        {/* Progress & Step Indicator */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Step {step} of 3</span>
            <span>
              {step === 1 && "Identity"}
              {step === 2 && "Moods"}
              {step === 3 && "Connection"}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5 w-full bg-muted" />
        </div>

        {/* Step Content */}
        <div className="min-h-[280px] py-2">
          {step === 1 && (
            <GenderStep
              gender={gender}
              onSelectGender={(g) => {
                setGender(g)
                setError(null)
              }}
            />
          )}

          {step === 2 && (
            <MoodsStep moods={moods} onChangeMoods={setMoods} />
          )}

          {step === 3 && (
            <InviteCodeStep
              inviteCode={inviteCode}
              onRegenerateCode={() => setInviteCode(generateInviteCode())}
              partnerCode={partnerCode}
              onChangePartnerCode={(val) => {
                setPartnerCode(val)
                setError(null)
              }}
              tab={tab}
              onChangeTab={(t) => {
                setTab(t)
                setError(null)
              }}
              error={error}
            />
          )}
        </div>

        {/* Global Error message (for step 1 & general) */}
        {error && step !== 3 && (
          <p className="pb-3 text-center text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center gap-3 pt-3">
          {step > 1 && (
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

          {step < 3 ? (
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

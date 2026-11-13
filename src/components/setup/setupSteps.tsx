import type { ReactNode } from "react"
import { GenderStep } from "./GenderStep"
import { ProfileStep } from "./ProfileStep"
import { ConnectionChoiceStep } from "./ConnectionChoiceStep"
import { AnniversaryStep } from "./AnniversaryStep"
import { MoodsStep } from "./MoodsStep"
import { NudgesStep } from "./NudgesStep"
import { ShareCodeStep } from "./ShareCodeStep"
import {
  DEFAULT_MOOD_OPTIONS,
  DEFAULT_NUDGE_OPTIONS,
  generateInviteCode,
  getDefaultAvatar,
} from "@/lib/relationship"
import type { Gender, MoodOption, NudgeOption } from "@/types/relationship"

export interface SetupWizardState {
  gender: Gender | null
  name: string
  avatar: string
  connectionType: "create" | "join"
  inviteCode: string
  partnerCode: string
  anniversary: string | null
  moods: MoodOption[]
  nudges: NudgeOption[]
  [key: string]: unknown
}

export interface StepRenderProps {
  state: SetupWizardState
  updateState: (updates: Partial<SetupWizardState>) => void
  error: string | null
  setError: (error: string | null) => void
}

export interface SetupStepConfig {
  id: string
  title: string
  subtitle?: string
  /**
   * Conditional rule: return false if this step should be skipped based on wizard state.
   */
  isVisible?: (state: SetupWizardState) => boolean
  /**
   * Validation rule executed before advancing to the next step.
   * Return a string message to halt progression with an error, or null if valid.
   */
  validate?: (state: SetupWizardState) => string | null
  /**
   * Render function for this step's UI.
   */
  render: (props: StepRenderProps) => ReactNode
}

export const initialWizardState: SetupWizardState = {
  gender: null,
  name: "",
  avatar: "🙋‍♂️",
  connectionType: "join", // Default to "join"
  inviteCode: generateInviteCode(),
  partnerCode: "",
  anniversary: null,
  moods: DEFAULT_MOOD_OPTIONS,
  nudges: DEFAULT_NUDGE_OPTIONS,
}

export const SETUP_STEPS: SetupStepConfig[] = [
  // 1. Gender Step
  {
    id: "gender",
    title: "Gender",
    subtitle: "Select your identity",
    validate: (state) => {
      if (!state.gender) {
        return "Please select your gender to continue."
      }
      return null
    },
    render: ({ state, updateState, setError }) => (
      <GenderStep
        gender={state.gender}
        onSelectGender={(gender) => {
          updateState({
            gender,
            avatar: getDefaultAvatar(gender),
          })
          setError(null)
        }}
      />
    ),
  },

  // 2. Profile Step (Icon & Name)
  {
    id: "profile",
    title: "Profile",
    subtitle: "Name and icon",
    validate: (state) => {
      if (!state.name.trim()) {
        return "Please enter your name or nickname."
      }
      return null
    },
    render: ({ state, updateState, error, setError }) => (
      <ProfileStep
        gender={state.gender}
        name={state.name}
        avatar={state.avatar}
        onChangeName={(name) => {
          updateState({ name })
          setError(null)
        }}
        onChangeAvatar={(avatar) => updateState({ avatar })}
        error={error}
      />
    ),
  },

  // 3. Connect: Default Join or Create Choice
  {
    id: "connection",
    title: "Connection",
    subtitle: "Join or create relationship",
    validate: (state) => {
      if (state.connectionType === "join" && state.partnerCode.trim().length !== 5) {
        return "Please enter a valid 5-digit partner code."
      }
      return null
    },
    render: ({ state, updateState, error, setError }) => (
      <ConnectionChoiceStep
        connectionType={state.connectionType}
        onChangeConnectionType={(connectionType) => {
          updateState({ connectionType })
          setError(null)
        }}
        partnerCode={state.partnerCode}
        onChangePartnerCode={(partnerCode) => {
          updateState({ partnerCode })
          setError(null)
        }}
        error={error}
      />
    ),
  },

  // 4. Anniversary Date (Conditional: Only if Step 3 chose "create")
  {
    id: "anniversary",
    title: "Anniversary",
    subtitle: "Special date",
    isVisible: (state) => state.connectionType === "create",
    render: ({ state, updateState }) => (
      <AnniversaryStep
        anniversary={state.anniversary}
        onChangeAnniversary={(anniversary) => updateState({ anniversary })}
      />
    ),
  },

  // 5. Moods Override (Conditional: Only if Step 3 chose "create")
  {
    id: "moods",
    title: "Moods",
    subtitle: "Mood check-ins",
    isVisible: (state) => state.connectionType === "create",
    render: ({ state, updateState }) => (
      <MoodsStep
        moods={state.moods}
        onChangeMoods={(moods) => updateState({ moods })}
      />
    ),
  },

  // 6. Nudges Override (Conditional: Only if Step 3 chose "create")
  {
    id: "nudges",
    title: "Nudges",
    subtitle: "Quick alerts",
    isVisible: (state) => state.connectionType === "create",
    render: ({ state, updateState }) => (
      <NudgesStep
        nudges={state.nudges}
        onChangeNudges={(nudges) => updateState({ nudges })}
      />
    ),
  },

  // 7. Invite Code Step (Conditional: Only if Step 3 chose "create")
  {
    id: "invite-code",
    title: "Invite Code",
    subtitle: "Share with partner",
    isVisible: (state) => state.connectionType === "create",
    render: ({ state, updateState }) => (
      <ShareCodeStep
        inviteCode={state.inviteCode}
        onRegenerateCode={() => updateState({ inviteCode: generateInviteCode() })}
      />
    ),
  },
]

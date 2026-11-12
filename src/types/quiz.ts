export interface QuizContent {
  tags?: string[]
  options: string[]
  question: string
}

export interface Quiz {
  id: number
  content: QuizContent | null
  created_at: string
  updated_at: string | null
}

export interface QuizAnswerContent {
  selectedOption: string
  optionIndex?: number
}

export interface QuizAnswer {
  id: number
  quiz_id: number
  user_id: string
  relationship_id: number
  content: QuizAnswerContent | null
  created_at: string
  updated_at: string | null
}

export interface SubmitQuizAnswerInput {
  quizId: number
  relationshipId: number
  content: QuizAnswerContent
}


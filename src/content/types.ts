export type Level = 'A2' | 'B1' | 'B2'

export type Feedback = {
  rule: string
  cue: string
  trick?: string
}

type ExerciseBase = {
  id: string
  topic: string
  fb: Feedback
}

export type GapExercise = ExerciseBase & {
  kind: 'gap'
  text: string
  en?: string
}

export type ChoiceExercise = ExerciseBase & {
  kind: 'choice'
  prompt: string
  options: string[]
  answer: number
}

export type TransformExercise = ExerciseBase & {
  kind: 'transform'
  instruction: string
  source: string
  answers: string[]
}

export type Exercise = GapExercise | ChoiceExercise | TransformExercise

export type Example = { de: string; en: string; note?: string }

export type Topic = {
  id: string
  level: Level
  title: string
  summary: string
  rule: string[]
  tables: string[]
  tricks: string[]
  traps: string[]
  examples: Example[]
  inCTests: string
  writing: string[]
  exercises: Exercise[]
}

export type GrammarTable = {
  id: string
  title: string
  level: Level
  topics: string[]
  cols: string[]
  rows: string[]
  cells: string[][]
  pattern: string
  tricks: string[]
  highlight?: [number, number][]
}

export type Verb = {
  inf: string
  en: string
  kind: 'weak' | 'strong' | 'mixed' | 'modal' | 'irregular'
  group?: string
  present?: string[]
  du?: string
  er?: string
  praet: string
  p2: string
  aux: 'haben' | 'sein' | 'both'
  k2?: string
  sep?: string
}

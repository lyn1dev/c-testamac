import { z } from 'zod'
import { TOPIC_CATALOG } from '../content/catalog'
import { gapAnswers } from '../content/exercise'
import { STRATEGIES, STRATEGY_IDS } from '../content/strategies'
import type { Exercise } from '../content/types'
import { gradeGap, makeCTest, type Gap } from '../ctest/gapper'
import type { CTestLevel } from '../ctest/texts'
import { chatJson, type AiConfig } from './openrouter'

const TOPIC_IDS = TOPIC_CATALOG.map((t) => t.id) as [string, ...string[]]
const topicList = TOPIC_CATALOG.map((t) => `${t.id} (${t.title})`).join(', ')
const SYSTEM =
  'You are an expert teacher of German as a foreign language and C-test author. Your German is flawless standard German (Duden). Explanations are short, concrete English. Always reply with a single JSON object and nothing else.'

const LEVEL_SPEC: Record<CTestLevel, string> = {
  B1: 'CEFR B1: everyday topics (work, study, housing, health, travel, environment), mostly main clauses plus weil/dass/wenn/obwohl clauses, Perfekt and Präteritum of common verbs, common vocabulary.',
  B2: 'CEFR B2: newspaper or popular-science register (society, education, technology, economy), subordinate and relative clauses, passive, Konjunktiv I/II, nominal style, some abstract vocabulary.',
  'B2+': 'upper B2 / C1 entry: dense academic or quality-press register, participial attributes, nominal style, Funktionsverbgefüge, advanced connectors, Konjunktiv I in reported speech.',
}

const textSchema = z.object({
  title: z.string().min(2).max(80),
  text: z.string().min(200).max(2000),
  properNames: z.array(z.string()).default([]),
})

export type GeneratedText = z.infer<typeof textSchema>

export async function generateText(
  cfg: AiConfig,
  opts: { level: CTestLevel; gaps: number; focus?: string; avoidTitles?: string[] },
): Promise<GeneratedText> {
  const focus = opts.focus ? TOPIC_CATALOG.find((t) => t.id === opts.focus)?.title : undefined
  const prompt = [
    `Write an original German text for a C-test at level ${opts.level}. ${LEVEL_SPEC[opts.level]}`,
    `Length: 7–9 sentences, ${Math.round(opts.gaps * 2.5 + 40)}–${Math.round(opts.gaps * 3 + 70)} words. The first and the last sentence will stay intact; the sentences in between must contain at least ${opts.gaps * 2 + 4} words of two or more letters that are not numbers or proper names.`,
    focus
      ? `Make the text dense in this grammar topic (use it in at least 6 places, naturally): ${focus}.`
      : 'Use a natural mix of grammar typical for the level.',
    'No headings, no lists, no numbers written as digits, no quotation marks, no abbreviations.',
    opts.avoidTitles?.length ? `Choose a topic different from: ${opts.avoidTitles.slice(0, 12).join('; ')}.` : '',
    'Return {"title": string, "text": string, "properNames": string[]} where properNames lists every proper name (people, places, organisations) that occurs in the text, spelled exactly as in the text.',
  ].join('\n')
  const draft = await chatJson(cfg, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], textSchema, {
    temperature: 0.8,
    check: (v) => textProblem(v, opts.gaps),
  })
  return proofread(cfg, draft, opts.gaps)
}

function textProblem(v: GeneratedText, gaps: number): string | null {
  const missing = v.properNames.filter((n) => !v.text.includes(n))
  if (missing.length) return `properNames not found in text: ${missing.join(', ')}`
  if (/\d/.test(v.text)) return 'text contains digits'
  const ct = makeCTest(v.text, { gaps, properNames: v.properNames })
  if (ct.sentences.length < 5) return 'text needs at least 5 sentences'
  if (ct.gaps.length < gaps)
    return `text too short: only ${ct.gaps.length} of ${gaps} gaps fit between the first and last sentence; add longer middle sentences`
  return null
}

const proofSchema = z.object({
  text: z.string().min(200).max(2000),
  corrections: z.array(z.object({ wrong: z.string(), right: z.string() })).default([]),
})

async function proofread(cfg: AiConfig, draft: GeneratedText, gaps: number): Promise<GeneratedText> {
  const prompt = [
    'Proofread this German text, which will become a C-test whose deleted letters are graded against the text. Every word must be flawless standard German (Duden): grammar, endings, spelling, capitalisation, comma placement and idiomatic usage.',
    'Fix only real errors and keep everything else identical: the same sentences, the same proper names, no digits.',
    `Text: """${draft.text}"""`,
    'Return {"text": the full corrected text, "corrections": [{"wrong": fragment, "right": fragment}] (empty if nothing was wrong)}',
  ].join('\n')
  const out = await chatJson(cfg, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], proofSchema, {
    temperature: 0,
    check: (v) => textProblem({ ...draft, text: v.text }, gaps),
  })
  return { ...draft, text: out.text }
}

export type ReviewGap = { n: number; gap: Gap; given: string; sentence: string; correct: boolean }

const explainSchema = z.object({
  items: z.array(
    z.object({
      n: z.number().int(),
      accepted: z.boolean().default(false),
      explanation: z.string().default(''),
      rule: z.string().default(''),
      trick: z.string().default(''),
      topic: z.enum([...TOPIC_IDS, 'vocabulary']).catch('vocabulary'),
      strategy: z.enum(STRATEGY_IDS as [string, ...string[]]).catch('read-first'),
    }),
  ),
})

export type GapExplanation = z.infer<typeof explainSchema>['items'][number]

export async function explainGaps(
  cfg: AiConfig,
  opts: { text: string; gaps: ReviewGap[]; letterCount: boolean },
): Promise<GapExplanation[]> {
  const line = (w: ReviewGap) =>
    `${w.n}. sentence: "${w.sentence}" | visible: "${w.gap.prefix}" | correct word: "${w.gap.word}"` +
    (w.correct ? '' : ` | learner wrote: "${w.gap.prefix}${w.given}"`)
  const wrong = opts.gaps.filter((g) => !g.correct)
  const right = opts.gaps.filter((g) => g.correct)
  const prompt = [
    'A learner did a German C-test (the second half of words was deleted; they typed the missing part). Full text:',
    opts.text,
    '',
    wrong.length ? `These gaps were graded wrong:\n${wrong.map(line).join('\n')}\n` : '',
    right.length ? `These gaps were answered correctly:\n${right.map(line).join('\n')}\n` : '',
    'Return one item for EACH gap, wrong or correct. For a gap answered correctly return only n, topic and strategy. For a gap graded wrong return:',
    '- n: the gap number',
    `- accepted: true only if the learner's full word is ALSO grammatically and semantically correct in this exact context${opts.letterCount ? ' and has the same number of missing letters' : ''}. Spelling errors, ae/oe/ue/ss for ä/ö/ü/ß, and wrong capitalisation are never accepted.`,
    '- explanation: max 2 sentences: why the correct word is right and what was wrong with the learner\'s answer, pointing to the cue in the sentence',
    '- rule: the grammar rule in one short line',
    '- trick: a short memory trick (may be empty)',
    `- topic: the grammar topic id that best fits, one of: ${topicList}; or "vocabulary" if it is purely a vocabulary/meaning issue`,
    `- strategy: the C-test strategy id that would have caught it, one of: ${STRATEGIES.map((s) => `${s.id} (${s.title})`).join(', ')}`,
    'Return {"items": [...]}',
  ].join('\n')
  const byN = new Map(opts.gaps.map((w) => [w.n, w]))
  const out = await chatJson(cfg, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], explainSchema, {
    temperature: 0.2,
    check: (v) => {
      const got = new Set(v.items.map((i) => i.n))
      const missing = [...byN.keys()].filter((n) => !got.has(n))
      if (missing.length) return `missing items for gaps ${missing.join(', ')}`
      const bare = v.items.filter((i) => byN.get(i.n)?.correct === false && i.explanation.trim().length < 3)
      return bare.length ? `missing explanation for wrong gaps ${bare.map((i) => i.n).join(', ')}` : null
    },
  })
  const seen = new Set<number>()
  return out.items
    .filter((i) => byN.has(i.n) && !seen.has(i.n) && !!seen.add(i.n))
    .map((i) => {
      const w = byN.get(i.n)!
      if (w.correct) return { ...i, accepted: false, explanation: '', rule: '', trick: '' }
      const plausible =
        w.given.trim() !== '' &&
        !gradeGap(w.gap, w.given).spellingHint &&
        (!opts.letterCount || [...w.given.trim()].length === [...w.gap.answer].length)
      return { ...i, accepted: i.accepted && plausible }
    })
}

const followUpSchema = z.object({ answer: z.string().min(1) })

export async function askFollowUp(
  cfg: AiConfig,
  opts: { sentence: string; word: string; given: string; explanation: string; question: string },
): Promise<string> {
  const prompt = [
    'A learner made this mistake in a German C-test.',
    `Sentence: "${opts.sentence}" | correct word: "${opts.word}" | learner wrote: "${opts.given}"`,
    `Explanation they were given: ${opts.explanation}`,
    `Their follow-up question: ${opts.question}`,
    'Answer it in at most 4 short English sentences, with a German example if it helps. Return {"answer": string}',
  ].join('\n')
  const out = await chatJson(cfg, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], followUpSchema, {
    temperature: 0.3,
  })
  return out.answer
}

const feedbackSchema = z.object({ rule: z.string().min(3), cue: z.string().min(1), trick: z.string().optional() })
const aiExerciseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('gap'), text: z.string().min(5), en: z.string().optional(), fb: feedbackSchema }),
  z.object({
    kind: z.literal('choice'),
    prompt: z.string().min(3),
    options: z.array(z.string().min(1)).min(2).max(5),
    answer: z.number().int(),
    fb: feedbackSchema,
  }),
  z.object({
    kind: z.literal('transform'),
    instruction: z.string().min(3),
    source: z.string().min(3),
    answers: z.array(z.string().min(2)).min(1),
    fb: feedbackSchema,
  }),
])
const exercisesSchema = z.object({ exercises: z.array(aiExerciseSchema).min(1) })

export function exerciseProblem(e: z.infer<typeof aiExerciseSchema>): string | null {
  if (e.kind === 'gap') {
    if (gapAnswers(e.text).length === 0) return 'gap exercise without {answer} marker'
    if (/[{}]/.test(e.text.replace(/\{[^{}]+\}/g, ''))) return 'unbalanced braces'
  }
  if (e.kind === 'choice') {
    if (e.answer < 0 || e.answer >= e.options.length) return 'choice answer index out of range'
    if (new Set(e.options).size !== e.options.length) return 'duplicate options'
  }
  return null
}

export async function generateExercises(
  cfg: AiConfig,
  opts: { topic: string; kinds: Exercise['kind'][]; count: number; level: string; avoid?: string[] },
): Promise<Exercise[]> {
  const t = TOPIC_CATALOG.find((x) => x.id === opts.topic)
  const prompt = [
    `Create ${opts.count} new German grammar exercises on "${t?.title ?? opts.topic}" for a learner at about ${opts.level}. Kinds to use (mix them): ${opts.kinds.join(', ')}.`,
    'Each exercise must be in context (a realistic 1–2 sentence situation) and have exactly one correct solution; if several answers are correct, list them all.',
    'Formats:',
    '- gap: {"kind":"gap","text":"German sentence with answers in braces, e.g. Ich warte auf d{en} Bus. Alternatives with |: {weil|da}. Braces may cover only the second half of a word.","en":"English translation","fb":{...}}',
    '- choice: {"kind":"choice","prompt":"German sentence with ___","options":["…","…","…"],"answer":<index>,"fb":{...}}',
    '- transform: {"kind":"transform","instruction":"English instruction","source":"German sentence","answers":["every correct German result"],"fb":{...}}',
    'fb = {"rule":"one-line English rule","cue":"the word(s) in the sentence that signal the answer","trick":"short memory trick"}',
    opts.avoid?.length ? `Do not repeat these sentences: ${opts.avoid.slice(-10).join(' | ')}` : '',
    'Return {"exercises":[...]}',
  ].join('\n')
  const out = await chatJson(
    cfg,
    [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
    exercisesSchema,
    {
      temperature: 0.7,
      check: (v) => v.exercises.map(exerciseProblem).find((p) => p !== null) ?? null,
    },
  )
  const stamp = Date.now().toString(36)
  return out.exercises.map((e, i) => ({ ...e, id: `ai:${opts.topic}:${stamp}:${i}`, topic: opts.topic }) as Exercise)
}

const writingSchema = z.object({
  correct: z.boolean(),
  corrected: z.string(),
  errors: z.array(z.object({ wrong: z.string(), right: z.string(), rule: z.string() })).default([]),
  comment: z.string().default(''),
  usedTopic: z.boolean().default(true),
})

export type WritingFeedback = z.infer<typeof writingSchema>

export async function correctWriting(
  cfg: AiConfig,
  opts: { topic: string; task: string; answer: string },
): Promise<WritingFeedback> {
  const t = TOPIC_CATALOG.find((x) => x.id === opts.topic)
  const prompt = [
    `Grammar topic: ${t?.title ?? opts.topic}. Task given to the learner: ${opts.task}`,
    `Learner's German answer: """${opts.answer}"""`,
    'Correct it. correct = true only if there are no grammar or spelling errors. corrected = the minimally corrected version (keep the learner\'s wording). errors = each error with the wrong fragment, the right fragment and a one-line English rule. usedTopic = whether the answer actually uses the grammar topic. comment = one short English sentence of advice.',
    'Return {"correct":bool,"corrected":string,"errors":[{"wrong":string,"right":string,"rule":string}],"comment":string,"usedTopic":bool}',
  ].join('\n')
  return chatJson(cfg, [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }], writingSchema, {
    temperature: 0.1,
    check: (v) => (!v.correct && v.errors.length === 0 ? 'correct=false but no errors listed' : null),
  })
}

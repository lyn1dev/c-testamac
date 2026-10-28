export type Strategy = { id: string; title: string; text: string; example?: string }

export const STRATEGIES: Strategy[] = [
  {
    id: 'read-first',
    title: 'Read the whole text first',
    text: 'Spend 20–30 seconds reading the intact first sentence and skimming the rest. The topic tells you which nouns and verbs to expect.',
  },
  {
    id: 'word-class',
    title: 'Decide the word class before the word',
    text: 'Ask: article, pronoun, preposition, verb, noun, adjective? The position in the sentence usually decides it. Only then think of the actual word.',
    example: 'Er wartet a__ den Bus → between verb and article: a preposition → auf.',
  },
  {
    id: 'function-words',
    title: 'Expect function words',
    text: 'About half of all gaps are short, frequent words: articles, pronouns, prepositions, conjunctions, auxiliaries. Know the top 100 cold so these gaps cost you zero seconds.',
    example: 'u__ → und, d__ → der/die/das/den/dem, ab__ → aber, ni___ → nicht.',
  },
  {
    id: 'agreement',
    title: 'Check agreement: subject ↔ verb, article ↔ noun',
    text: 'Find the subject and make the verb ending match. Find the noun and make article and adjective endings match its gender, number and case.',
    example: 'Die Studenten mü____ … → plural subject → müssen.',
  },
  {
    id: 'case-trigger',
    title: 'Find the case trigger',
    text: 'Before writing an ending, find what decides the case: a preposition, the verb, or the role in the sentence. Then apply the signal endings r-e-s-n-m.',
    example: 'mit d__ Freund → mit = dative → dem.',
  },
  {
    id: 'verb-position',
    title: 'Use verb position',
    text: 'Position 2 = finite verb in main clauses; the end of the clause = verb after weil/dass/wenn or the second part of the verb bracket (Partizip II, infinitive, separable prefix).',
    example: '…, weil er krank ge_____ ist → end of a weil-clause before ist → Partizip II: gewesen.',
  },
  {
    id: 'letter-count',
    title: 'Use the prefix and the letter count',
    text: 'The visible half and the number of missing letters rule out most candidates. The word has exactly twice the visible letters, or twice plus one.',
    example: 'di___ (3 missing, 2 visible) → 5 letters → diese/dies? → diese.',
  },
  {
    id: 'collocation',
    title: 'Think in fixed phrases',
    text: 'Many gaps sit inside set expressions, verb–preposition pairs and noun–verb combinations. Learn them as blocks.',
    example: 'eine Entscheidung tre____ → treffen; Interesse a_ → an.',
  },
  {
    id: 'logic',
    title: 'Follow the logic of the text',
    text: 'Connectors (aber, deshalb, trotzdem, obwohl) and negation depend on meaning. Ask what the sentence must say given the sentence before it.',
    example: 'Es regnete, trot____ gingen wir spazieren → contrast → trotzdem.',
  },
  {
    id: 'spelling',
    title: 'Spell it exactly',
    text: 'Only exact spelling counts: umlauts, ß, capitalisation. ae/oe/ue/ss are wrong. Reread every answer once at the end.',
    example: 'mü___ → müssen, not muessen; Stra__ → Straße.',
  },
  {
    id: 'time',
    title: 'Skip and come back',
    text: 'Do not stay on one gap. Fill everything easy first; later gaps often reveal the meaning of earlier ones. Guess rather than leave blank.',
  },
]

export const STRATEGY_IDS = STRATEGIES.map((s) => s.id)

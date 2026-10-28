import type { Verb } from './types'

export const PERSONS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'] as const

export const TENSES = [
  'present',
  'praeteritum',
  'perfekt',
  'plusquamperfekt',
  'futur1',
  'konjunktiv2',
  'konjunktiv1',
] as const
export type Tense = (typeof TENSES)[number]

export const TENSE_LABELS: Record<Tense, string> = {
  present: 'Präsens',
  praeteritum: 'Präteritum',
  perfekt: 'Perfekt',
  plusquamperfekt: 'Plusquamperfekt',
  futur1: 'Futur I',
  konjunktiv2: 'Konjunktiv II',
  konjunktiv1: 'Konjunktiv I',
}

const SEIN = ['bin', 'bist', 'ist', 'sind', 'seid', 'sind']
const HABEN = ['habe', 'hast', 'hat', 'haben', 'habt', 'haben']
const WAR = ['war', 'warst', 'war', 'waren', 'wart', 'waren']
const HATTE = ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten']
const WERDEN = ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden']
const WUERDE = ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden']

function base(v: Verb): string {
  return v.sep ? v.inf.slice(v.sep.length) : v.inf
}

function withSep(forms: string[], sep?: string): string[] {
  if (!sep) return forms
  return forms.map((f) => f.split('/').map((alt) => `${alt} ${sep}`).join('/'))
}

function needsE(stem: string): boolean {
  return /[td]$/.test(stem) || /(ch|[^aeiouäöülrmnh])[mn]$/.test(stem)
}

function present(v: Verb): string[] {
  if (v.present) return withSep(v.present, v.sep)
  const inf = base(v)
  let forms: string[]
  if (/[^aeiouäöü](el|er)n$/.test(inf)) {
    const stem = inf.slice(0, -1)
    const ich = inf.endsWith('eln') ? `${inf.slice(0, -3)}le` : `${stem}e`
    forms = [ich, `${stem}st`, `${stem}t`, inf, `${stem}t`, inf]
  } else {
    const stem = inf.replace(/e?n$/, '')
    const e = needsE(stem) ? 'e' : ''
    const du = /(s|ß|z|x)$/.test(stem) ? `${stem}t` : `${stem}${e}st`
    forms = [`${stem}e`, du, `${stem}${e}t`, inf, `${stem}${e}t`, inf]
  }
  if (v.du) forms[1] = v.du
  if (v.er) forms[2] = v.er
  return withSep(forms, v.sep)
}

function weakEndings(p: string): string[] {
  return [p, `${p}st`, p, `${p}n`, `${p}t`, `${p}n`]
}

function praeteritum(v: Verb): string[] {
  const p = v.praet
  if (p.endsWith('e')) return withSep(weakEndings(p), v.sep)
  const dental = /[td]$/.test(p)
  const sibilant = /(s|ß|z|x)$/.test(p)
  const du = dental ? `${p}est/${p}st` : sibilant ? `${p}est/${p}t` : `${p}st`
  const wir = `${p}en`
  return withSep([p, du, p, wir, dental ? `${p}et` : `${p}t`, wir], v.sep)
}

function compound(aux: string[], part: string): string[] {
  return aux.map((a) => `${a} ${part}`)
}

function perfectLike(v: Verb, sein: string[], haben: string[]): string[] {
  const s = compound(sein, v.p2)
  const h = compound(haben, v.p2)
  if (v.aux === 'sein') return s
  if (v.aux === 'haben') return h
  return s.map((f, i) => `${f}/${h[i]}`)
}

function konjunktiv2(v: Verb): string[] {
  const wuerde = compound(WUERDE, v.inf)
  if (!v.k2) return wuerde
  const k = v.k2
  const strong = !k.endsWith('te')
  const stem = k.slice(0, -1)
  const forms = strong
    ? [k, `${k}st/${stem}st`, k, `${k}n`, `${k}t/${stem}t`, `${k}n`]
    : weakEndings(k)
  const synthetic = withSep(forms, v.sep)
  if (v.kind === 'modal' || ['sein', 'haben', 'werden'].includes(v.inf)) return synthetic
  return synthetic.map((f, i) => `${f}/${wuerde[i]}`)
}

function konjunktiv1(v: Verb): string[] {
  if (v.inf === 'sein') return ['sei', 'seiest/seist', 'sei', 'seien', 'seiet', 'seien']
  const inf = base(v)
  const stem = inf.replace(/e?n$/, '')
  return withSep([`${stem}e`, `${stem}est`, `${stem}e`, inf, `${stem}et`, inf], v.sep)
}

export function conjugate(v: Verb, tense: Tense): string[] {
  switch (tense) {
    case 'present':
      return present(v)
    case 'praeteritum':
      return praeteritum(v)
    case 'perfekt':
      return perfectLike(v, SEIN, HABEN)
    case 'plusquamperfekt':
      return perfectLike(v, WAR, HATTE)
    case 'futur1':
      return compound(WERDEN, v.inf)
    case 'konjunktiv2':
      return konjunktiv2(v)
    case 'konjunktiv1':
      return konjunktiv1(v)
  }
}

export function allForms(v: Verb): string[] {
  const forms = new Set<string>([v.inf, v.p2, v.praet])
  for (const t of ['present', 'praeteritum', 'konjunktiv2', 'konjunktiv1'] as const) {
    for (const f of conjugate(v, t)) for (const alt of f.split('/')) forms.add(alt.split(' ')[0])
  }
  return [...forms]
}

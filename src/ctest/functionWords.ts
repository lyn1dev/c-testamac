import type { Gap } from './gapper'

export const FUNCTION_WORDS = new Set(
  `der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines
  und oder aber denn sondern doch dass weil wenn als ob obwohl damit bevor nachdem während seit bis sobald
  ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man
  mein meine meinen meinem meiner sein seine seinen seinem seiner ihre ihren ihrem ihrer unser unsere unseren
  dieser diese dieses diesen diesem jeder jede jedes jeden jedem alle allen viele vielen
  ist sind war waren bin bist hat haben hatte hatten wird werden wurde wurden kann können muss müssen soll sollen will wollen
  nicht auch noch schon nur sehr mehr immer wieder dann jetzt hier dort so wie was wer wo
  mit von für auf aus bei nach zu zum zur im am um über unter durch gegen ohne vor hinter neben zwischen in an
  wegen trotz deshalb trotzdem außerdem also zwar etwa sogar dabei darauf damit davon dafür daran`
    .split(/\s+/)
    .filter(Boolean),
)

export function functionWordGaps(sentence: string): { gap: Gap }[] {
  const out: { gap: Gap }[] = []
  let id = 0
  for (const m of sentence.normalize('NFC').matchAll(/[\p{L}]+/gu)) {
    const word = m[0]
    const letters = [...word]
    if (letters.length < 2 || !FUNCTION_WORDS.has(word.toLowerCase()) || m.index === 0) continue
    const keep = Math.floor(letters.length / 2)
    out.push({
      gap: {
        id: id++,
        word,
        prefix: letters.slice(0, keep).join(''),
        answer: letters.slice(keep).join(''),
        sentence: 0,
        start: m.index,
        end: m.index + word.length,
      },
    })
  }
  return out
}

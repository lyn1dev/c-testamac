import type { z } from 'zod'

const BASE = 'https://openrouter.ai/api/v1'

export type ModelInfo = { id: string; name: string; context: number; promptPrice: number }
export type AiConfig = { apiKey: string; model: string }
export type Message = { role: 'system' | 'user' | 'assistant'; content: string }

export class AiError extends Error {}

export async function fetchModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE}/models`)
  if (!res.ok) throw new AiError(`model list failed: ${res.status}`)
  const body = (await res.json()) as {
    data?: { id: string; name?: string; context_length?: number; pricing?: { prompt?: string } }[]
  }
  return (body.data ?? [])
    .map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      context: m.context_length ?? 0,
      promptPrice: Number(m.pricing?.prompt ?? 0) * 1_000_000,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function extractJson(content: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(content)?.[1] ?? content
  const start = fenced.indexOf('{')
  const end = fenced.lastIndexOf('}')
  if (start < 0 || end <= start) throw new AiError('no JSON object in response')
  return JSON.parse(fenced.slice(start, end + 1))
}

async function complete(cfg: AiConfig, messages: Message[], temperature: number): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    signal: AbortSignal.timeout(90_000),
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': globalThis.location?.origin ?? '',
      'X-Title': 'C-Test Coach',
    },
    body: JSON.stringify({ model: cfg.model, messages, temperature, response_format: { type: 'json_object' } }),
  }).catch((e: unknown) => {
    if (e instanceof DOMException && e.name === 'TimeoutError') throw new AiError('OpenRouter did not answer within 90 s — try again or pick a faster model.')
    throw e
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new AiError(`OpenRouter ${res.status}: ${text.slice(0, 200)}`)
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } }
  if (body.error) throw new AiError(body.error.message ?? 'OpenRouter error')
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new AiError('empty response')
  return content
}

export async function chatJson<S extends z.ZodType>(
  cfg: AiConfig,
  messages: Message[],
  schema: S,
  opts: { check?: (value: z.infer<S>) => string | null; temperature?: number; attempts?: number } = {},
): Promise<z.infer<S>> {
  const convo = [...messages]
  let lastError = ''
  for (let i = 0; i < (opts.attempts ?? 2); i++) {
    const content = await complete(cfg, convo, opts.temperature ?? 0.4)
    let problem: string
    try {
      const parsed = schema.safeParse(extractJson(content))
      if (parsed.success) {
        const issue = opts.check?.(parsed.data) ?? null
        if (issue === null) return parsed.data
        problem = issue
      } else {
        problem = parsed.error.issues
          .slice(0, 5)
          .map((x) => `${x.path.join('.')}: ${x.message}`)
          .join('; ')
      }
    } catch (e) {
      problem = e instanceof Error ? e.message : String(e)
    }
    lastError = problem
    convo.push({ role: 'assistant', content }, {
      role: 'user',
      content: `Your JSON was rejected: ${problem}. Reply again with only the corrected JSON object.`,
    })
  }
  throw new AiError(`invalid AI response: ${lastError}`)
}

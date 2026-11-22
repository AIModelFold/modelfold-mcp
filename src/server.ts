import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const BASE_URL = 'https://modelfold.ai/v1';
const PRICING_URL = 'https://modelfold.ai/pricing';
const label = z.string().trim().min(1).max(160);
const webUrl = z.string().url().refine(value => /^https?:\/\//i.test(value), 'Expected an HTTP(S) URL');
const modelList = z.object({ data: z.array(z.object({
  id: z.string(), modality: z.string(), provider: z.string().nullish(),
})) });
const chatResult = z.object({ choices: z.array(z.object({
  message: z.object({ content: z.string() }),
})).min(1) });
const imageResult = z.object({ data: z.array(z.object({ url: webUrl })).min(1) });
const quota = z.object({
  total: z.number(), used: z.number(), remaining: z.number(),
  usedPercent: z.number(), resetAt: z.number().nullable(),
});
const balanceResult = z.object({
  ok: z.literal(true), credits: z.number(),
  subscription: z.discriminatedUnion('active', [
    z.object({ active: z.literal(false) }),
    z.object({
      active: z.literal(true), plan: z.object({ nameZh: z.string(), nameEn: z.string() }),
      expiresAt: z.number(), window: quota, week: quota,
    }),
  ]),
  keyQuota: z.object({ limit: z.number(), used: z.number(), remaining: z.number() }).nullable(),
});

function text(value: string, isError = false) {
  return { content: [{ type: 'text' as const, text: value }], ...(isError ? { isError } : {}) };
}

const statusHints: Record<number, string> = {
  400: 'Check the model ID and parameters.',
  401: 'Check MODELFOLD_API_KEY.',
  403: 'Check account or key restrictions.',
  402: 'Check credits and key quota.',
  429: 'Try again later.',
};

export function createServer(apiKey: string, request: typeof fetch = fetch) {
  const server = new McpServer({ name: 'modelfold-mcp', version: '0.1.0' });

  async function call<T>(path: string, schema: z.ZodType<T>, body?: unknown, timeout = 30_000) {
    if (!apiKey) return { error: 'Set MODELFOLD_API_KEY before calling ModelFold.' } as const;
    let response: Response;
    try {
      response = await request(`${BASE_URL}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      return { error: 'Could not reach ModelFold or the request timed out. For billed calls, check your account before retrying.' } as const;
    }
    if (!response.ok) {
      return { error: `ModelFold returned HTTP ${response.status}. ${statusHints[response.status] ?? 'Check the request status before retrying.'}` } as const;
    }
    const parsed = schema.safeParse(await response.json().catch(() => null));
    return parsed.success ? { data: parsed.data } : { error: 'ModelFold returned an unexpected response.' };
  }

  server.registerTool('list_models', {
    description: 'List ModelFold models. Optionally filter by type (modality) or model vendor, ignoring case.',
    inputSchema: { type: label.optional(), vendor: label.optional() },
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async ({ type, vendor }) => {
    const result = await call('/models', modelList);
    if (!result.data) return text(result.error, true);
    const models = result.data.data.filter(model =>
      (!type || model.modality.toLowerCase() === type.toLowerCase()) &&
      (!vendor || model.provider?.toLowerCase() === vendor.toLowerCase()));
    return text(JSON.stringify({ models, pricing: PRICING_URL }));
  });

  server.registerTool('chat', {
    description: 'Run a non-streaming text chat completion with a ModelFold model. This is a billed call.',
    inputSchema: {
      model: label,
      messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1) })).min(1),
      max_tokens: z.number().int().positive().optional(),
      temperature: z.number().finite().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async args => {
    const result = await call('/chat/completions', chatResult, { ...args, stream: false }, 120_000);
    return result.data ? text(result.data.choices[0].message.content) : text(result.error, true);
  });

  server.registerTool('generate_image', {
    description: 'Generate an image with ModelFold and return its URL(s). This is a billed call.',
    inputSchema: {
      model: label, prompt: z.string().trim().min(1).max(2000), image_url: webUrl.optional(),
      resolution: label.optional(), aspect_ratio: label.optional(), quality: label.optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async args => {
    const result = await call('/images/generations', imageResult, args, 300_000);
    return result.data ? text(JSON.stringify({ urls: result.data.data.map(image => image.url) })) : text(result.error, true);
  });

  server.registerTool('get_balance', {
    description: 'Read the account credit balance, subscription quota and key quota for the configured ModelFold API key.',
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: true },
  }, async () => {
    const result = await call('/account/balance', balanceResult);
    return result.data ? text(JSON.stringify(result.data)) : text(result.error, true);
  });

  return server;
}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const key = (await readFile(join(homedir(), '.modelfold-keys', 'test.txt'), 'utf8')).trim();
assert.ok(key, 'The ModelFold test key file is empty');
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL('../dist/index.js', import.meta.url))],
  env: { MODELFOLD_API_KEY: key },
});
const client = new Client({ name: 'modelfold-smoke', version: '1.0.0' });

async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 130_000 });
  if (result.isError) throw new Error(`${name}: ${result.content[0].text}`);
  return result.content[0].text;
}

try {
  await client.connect(transport);
  const model = 'gpt-4o-mini';
  const { models } = JSON.parse(await call('list_models', { type: 'chat', vendor: 'OpenAI' }));
  assert.ok(models.some(entry => entry.id === model), 'The smoke-test model is not advertised');
  assert.ok(models.every(entry => entry.modality === 'chat' && entry.provider.toLowerCase() === 'openai'));
  console.log('PASS list_models (type/vendor filters)');
  const balance = JSON.parse(await call('get_balance'));
  assert.equal(balance.ok, true);
  assert.equal(typeof balance.credits, 'number');
  assert.equal(typeof balance.subscription.active, 'boolean');
  console.log('PASS get_balance (credits and subscription)');
  const reply = await call('chat', { model, messages: [{ role: 'user', content: 'Reply with OK.' }], max_tokens: 8 });
  assert.ok(reply.trim().length > 0, 'No chat text');
  console.log(`PASS chat (${model}, one request)`);
} finally {
  await client.close();
  await transport.close();
}

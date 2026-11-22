import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/server.js';

async function connect(context, request, apiKey = 'local-test') {
  const server = createServer(apiKey, request);
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  context.after(async () => { await client.close(); await server.close(); });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

test('lists tools and filters the public catalog by modality and vendor', async context => {
  const client = await connect(context, async (url, options) => {
    assert.equal(url, 'https://modelfold.ai/v1/models');
    assert.equal(options.headers.Authorization, 'Bearer local-test');
    return Response.json({ data: [
      { id: 'gpt-4o-mini', modality: 'chat', provider: 'OpenAI', privateField: true },
      { id: 'sample-image', modality: 'image', provider: 'OpenAI' },
      { id: 'sample-chat', modality: 'chat', provider: 'Google' },
    ] });
  });
  assert.deepEqual((await client.listTools()).tools.map(tool => tool.name).sort(),
    ['chat', 'generate_image', 'get_balance', 'list_models']);
  const result = await client.callTool({ name: 'list_models', arguments: { type: 'CHAT', vendor: 'openai' } });
  assert.deepEqual(JSON.parse(result.content[0].text).models,
    [{ id: 'gpt-4o-mini', modality: 'chat', provider: 'OpenAI' }]);
});

test('rejects invalid image parameters before making any network request', async context => {
  let calls = 0;
  const client = await connect(context, async () => { calls++; return Response.json({}); });
  for (const args of [
    { model: 'sample-image', prompt: '   ' },
    { model: 'sample-image', prompt: 'a'.repeat(2001) },
    { model: 'sample-image', prompt: 'Hello', image_url: 'file:///image.png' },
  ]) {
    const result = await client.callTool({ name: 'generate_image', arguments: args });
    assert.equal(result.isError, true);
  }
  assert.equal(calls, 0);
});

test('returns a status hint without passing remote errors to the client', async context => {
  const client = await connect(context, async () => Response.json({ error: { message: 'private detail' } }, { status: 401 }));
  const result = await client.callTool({ name: 'get_balance', arguments: {} });
  assert.equal(result.isError, true);
  assert.equal(result.content[0].text, 'ModelFold returned HTTP 401. Check MODELFOLD_API_KEY.');
});

test('supports tool discovery without credentials and does not make unauthenticated requests', async context => {
  let calls = 0;
  const client = await connect(context, async () => { calls++; return Response.json({}); }, '');
  assert.equal((await client.listTools()).tools.length, 4);
  const result = await client.callTool({ name: 'get_balance', arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /MODELFOLD_API_KEY/);
  assert.equal(calls, 0);
});

#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const apiKey = process.env.MODELFOLD_API_KEY?.trim() ?? '';

try {
  await createServer(apiKey).connect(new StdioServerTransport());
} catch {
  console.error('Could not start the ModelFold MCP server.');
  process.exitCode = 1;
}

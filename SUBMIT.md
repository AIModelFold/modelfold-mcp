# ModelFold MCP directory submissions

Status: materials prepared; nothing submitted to a directory or published to a package registry.

## Listing copy

- Name: **ModelFold**
- Description: **Discover ModelFold models, run chat and image generation, and check account balances.**
- Repository: https://github.com/AIModelFold/modelfold-mcp
- Website: https://modelfold.ai · [Pricing](https://modelfold.ai/pricing)
- License: MIT · Transport: local stdio · Runtime: Node.js 20+
- Tools: `list_models`, `chat`, `generate_image`, `get_balance`
- Configuration: `MODELFOLD_API_KEY`, required for tool calls and treated as a secret. Tool discovery needs no key. Never put a real key in listing metadata, a bundle, or a Dockerfile.

## Official MCP Registry

Use the included [`server.json`](server.json). It references npm package `modelfold-mcp@0.1.0`; its server name matches `package.json`'s `mcpName`.

1. Admin: sign in to an authorized npm account and publish `modelfold-mcp@0.1.0` after approval. Confirm that the public package contains `mcpName` and that its executable can start.
2. Install `mcp-publisher` following the [official guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx). Authenticate as the owning GitHub user via `mcp-publisher login github`, then run `mcp-publisher publish` from this directory.
3. Verify the name and version via the [public registry](https://registry.modelcontextprotocol.io). PyPI publication is not required for this listing.

## Smithery

Use a local MCP bundle (`.mcpb`), not the public ModelFold REST API URL. The bundle preserves stdio transport and asks for the user's ModelFold API key. It does not need npm or PyPI publication.

- Build the bundle as documented below. For the listing use the copy above and the `modelfold-mcp` server slug.
- Admin: with the [Smithery CLI](https://www.npmjs.com/package/@smithery/cli), run `smithery auth login`, choose an authorized namespace from `smithery namespace list`, then run `smithery mcp publish ./dist/modelfold-mcp-0.1.0.mcpb -n YOUR_NAMESPACE/modelfold-mcp` after approval. Confirm the local install and tool discovery from the listing.

To build the bundle from a source checkout without including local configuration or test keys:

```sh
npm ci
npm run build
mkdir -p dist/mcpb-stage/dist
cp manifest.json package.json package-lock.json LICENSE README.md dist/mcpb-stage/
cp dist/index.js dist/server.js dist/mcpb-stage/dist/
npm --prefix dist/mcpb-stage ci --omit=dev --ignore-scripts
npx --yes @anthropic-ai/mcpb@2.1.2 pack dist/mcpb-stage dist/modelfold-mcp-0.1.0.mcpb
```

## Glama

Admin: sign in with GitHub, then open [Glama MCP Servers](https://glama.ai/mcp/servers) → **Add MCP Server** and submit the public repository URL, display name and description above. This is a source-based listing; no npm/PyPI publication or deployed endpoint is required. The repo has its MIT license, `Dockerfile`, and `glama.json` maintainer metadata; see the [Glama submission FAQ](https://glama.ai/mcp/faq#faq-submit-mcp-server). If claiming or configuring the listing, use the listed GitHub maintainer. Do not enable billed tools for automated verification.

## Package publication handoff

Publishing is intentionally deferred. The npm archive is built with `npm pack --pack-destination dist`. Python source and wheel distributions are built with `python -m build python` under `python/dist/`. The Python SDK is separate from the MCP server.

Admin: provide authorized npm and PyPI publisher accounts, confirm the names `modelfold-mcp` and `modelfold`, and approve publication. The MCP Registry submission depends on the npm publish; the Smithery bundle and Glama source submission do not.

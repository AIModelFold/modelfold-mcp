# ModelFold MCP / ModelFold MCP 服务

Use [ModelFold](https://modelfold.ai)'s OpenAI-compatible API from an MCP client. This MIT-licensed server runs locally over stdio.

通过 MCP 客户端使用 [ModelFold](https://modelfold.ai) 的 OpenAI 兼容 API。服务采用 MIT 许可，在本机通过 stdio 运行。

## Tools / 工具

| Tool | English | 中文 |
|---|---|---|
| `list_models` | List models; filter by `type` (e.g. `chat`, `image`) and `vendor` (e.g. `OpenAI`, `Google`). | 列模型，可按类型和模型厂商筛选。 |
| `chat` | Generate a text reply from a model ID and `messages`. | 指定模型和消息，生成文本回复。 |
| `generate_image` | Generate images from `model` and `prompt`; returns URLs. | 按模型和提示词生成图片，返回 URL。 |
| `get_balance` | Read account credits, subscription and key quota. | 查询账户积分、订阅额度及 API Key 额度。 |

Chat and image calls are billed. See [current pricing](https://modelfold.ai/pricing) and approve billed calls only when intended. No automatic retries for billed requests.

对话和图片生成会扣费，见[当前价格](https://modelfold.ai/pricing)。请按需审批调用，服务不会自动重试扣费请求。

## Install / 安装

Requires Node.js 20+ and a ModelFold API key. The npm package is not published yet; install from GitHub now:

需要 Node.js 20+ 和 ModelFold API Key。npm 包尚未发布，可先从 GitHub 安装：

```sh
git clone https://github.com/AIModelFold/modelfold-mcp.git
cd modelfold-mcp
npm ci
npm run build
```

In the examples, use the absolute path to Node (`command -v node` on macOS/Linux), the absolute checkout path, and your own key. Keep the key out of Git; use your client's secret store if available. After npm publication, the command and arguments can instead be `npx` and `["-y", "modelfold-mcp@0.1.0"]`.

下面请替换为 Node 的绝对路径（macOS/Linux 可运行 `command -v node`）、仓库的绝对路径和自己的 Key。不要提交密钥；客户端支持密钥管理时优先使用。npm 发布后，也可以把命令和参数改成 `npx` 和 `["-y", "modelfold-mcp@0.1.0"]`。

### Claude Desktop

Open **Settings → Developer → Edit Config**, merge the example below into `claude_desktop_config.json`, then restart Claude Desktop.

打开 **Settings → Developer → Edit Config**，把下方配置合并进 `claude_desktop_config.json`，再重启 Claude Desktop。

```json
{
  "mcpServers": {
    "modelfold": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/modelfold-mcp/dist/index.js"],
      "env": { "MODELFOLD_API_KEY": "YOUR_MODELFOLD_API_KEY" }
    }
  }
}
```

### Claude Code

Set `MODELFOLD_API_KEY` in the environment used to launch Claude Code. In a POSIX shell, run the following. The single quotes preserve Claude Code's environment variable reference in the stored config. Check with `claude mcp list`.

请先在启动 Claude Code 的环境中设置 `MODELFOLD_API_KEY`。在 POSIX shell 中执行下方命令，保留单引号以让 Claude Code 在运行时读取环境变量。用 `claude mcp list` 检查。

```sh
claude mcp add-json --scope user modelfold '{"type":"stdio","command":"/absolute/path/to/node","args":["/absolute/path/to/modelfold-mcp/dist/index.js"],"env":{"MODELFOLD_API_KEY":"${MODELFOLD_API_KEY}"}}'
```

### Cursor

Save the Claude Desktop JSON example in `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project). For a project config, omit the secret from files you share. Verify under **Cursor Settings → Tools & MCP**.

将 Claude Desktop 的 JSON 示例保存到 `~/.cursor/mcp.json`（全局）或 `.cursor/mcp.json`（项目）。不要把含密钥的项目配置共享出去。在 **Cursor Settings → Tools & MCP** 中检查。

### Cline

Open **MCP Servers → Configure MCP Servers** and merge the Claude Desktop example into Cline's `cline_mcp_settings.json`. Keep auto-approval off for billed tools.

打开 **MCP Servers → Configure MCP Servers**，把 Claude Desktop 示例合并进 Cline 的 `cline_mcp_settings.json`。不要给扣费工具开启自动审批。

## Python / Python SDK

See the [Python SDK README](python/README.md) for a local install and usage example. The `modelfold` PyPI distribution is not published yet.

本地安装与使用见 [Python SDK 说明](python/README.md)。PyPI 上的 `modelfold` 包尚未发布。

## Verification / 验证

Run `npm test` for offline MCP tests. `node test/live-smoke.mjs` runs the stdio server against ModelFold with the dedicated test key at `~/.modelfold-keys/test.txt`. It makes two read-only requests and one billed chat request; it does not generate images.

运行 `npm test` 做离线 MCP 测试。`node test/live-smoke.mjs` 用指定测试 Key 验证 stdio，执行两次只读查询和一次扣费对话，不生成图片。

> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

面向 macOS 应用程序的模型上下文协议（MCP）服务器 Monorepo 仓库。

## 软件包

- 位于 `packages/*` 下的 TypeScript 工作区包：`apple-mail`、`calendar`、`contacts`、`finder`、`home`、`i18n`、`imessage`、`maps`、`music`、`notes`、`photos`、`reminders`、`safari`、`screen-time`、`shortcuts` 和 `voice-memos`。
- 位于 `packages/ical` 下由 `uv` 管理的 Python 包。

## 本地化

`packages/i18n`（`@somethingwithproof/mcp-i18n`）提供了一个零运行时依赖的 TypeScript 本地化辅助库，覆盖 45 个语言环境（20 个 Tier 1、15 个非洲和 10 个亚洲语言环境），用于 CLI 帮助信息、诊断信息、错误消息和本地化元数据。语言环境检测遵循 `LC_ALL`、`LC_MESSAGES` 和 `LANG`（以及 `--lang`），并默认回退为英语，以确保 MCP 工具模式和响应保持向后兼容。

## 常用命令

```bash
npm install
npm run build
npm run test
npm run lint
```

## 许可证

请参阅完整的[英文 README](../../../README.md) 和 [LICENSE](../../../LICENSE)。

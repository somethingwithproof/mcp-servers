> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

適用於 macOS 應用程式的 Model Context Protocol (MCP) 伺服器單一儲存庫（Monorepo）。

## 套件

- 位於 `packages/*` 下的 TypeScript 工作區套件：`apple-mail`、`calendar`、`contacts`、`finder`、`home`、`i18n`、`imessage`、`maps`、`music`、`notes`、`photos`、`reminders`、`safari`、`screen-time`、`shortcuts` 與 `voice-memos`。
- 位於 `packages/ical` 下並以 `uv` 管理的 Python 套件。

## 在地化

`packages/i18n`（`@somethingwithproof/mcp-i18n`）提供零執行時期相依性的 TypeScript 在地化輔助工具，支援 45 種語系（20 種 Tier 1 語系、15 種非洲語系與 10 種亞洲語系），用於 CLI 說明訊息、診斷資訊、錯誤訊息與在地化中繼資料。語系偵測會依循 `LC_ALL`、`LC_MESSAGES` 與 `LANG`（以及 `--lang`），預設為英文，以確保 MCP 工具架構與回應保持向後相容。

## 指令

```bash
npm install
npm run build
npm run test
npm run lint
```

## 授權條款

請參閱完整的[英文 README](../../../README.md)與 [LICENSE](../../../LICENSE)。

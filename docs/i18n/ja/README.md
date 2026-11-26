> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS アプリケーション向け Model Context Protocol (MCP) サーバーのモノレポです。

## パッケージ

- `packages/*` 配下の TypeScript ワークスペースパッケージ: `apple-mail`、`calendar`、`contacts`、`finder`、`home`、`i18n`、`imessage`、`maps`、`music`、`notes`、`photos`、`reminders`、`safari`、`screen-time`、`shortcuts`、`voice-memos`。
- `uv` で管理される `packages/ical` 配下の Python パッケージ。

## ローカライズ

`packages/i18n`（`@somethingwithproof/mcp-i18n`）は、CLI ヘルプ、診断情報、エラーメッセージ、およびローカライズ済みメタデータ向けに、ランタイム依存関係ゼロの TypeScript ローカライズヘルパーを 45 ロケール（Tier 1 が 20、アフリカ地域が 15、アジア地域が 10）で提供します。ロケール検出は `LC_ALL`、`LC_MESSAGES`、`LANG`（および `--lang`）を参照し、MCP ツールスキーマとレスポンスの後方互換性を維持するため、デフォルトは英語になっています。

## コマンド

```bash
npm install
npm run build
npm run test
npm run lint
```

## ライセンス

詳細は[英語版 README](../../../README.md)および [LICENSE](../../../LICENSE) を参照してください。

> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo ya seva za Model Context Protocol (MCP) kwa programu za macOS.

## Vifurushi

- Vifurushi vya nafasi ya kazi ya TypeScript chini ya `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, na `voice-memos`.
- Kifurushi cha Python chini ya `packages/ical` kinachosimamiwa na `uv`.

## Ujanibishaji

`packages/i18n` (`@somethingwithproof/mcp-i18n`) hutoa msaidizi wa ujanibishaji wa TypeScript usio na utegemezi wa wakati wa utekelezaji katika lugha na maeneo 45 (maeneo 20 ya Daraja la 1, 15 ya Afrika, na 10 ya Asia) kwa msaada wa CLI, uchunguzi, ujumbe wa hitilafu, na metadata iliyojanibishwa. Utambuzi wa eneo huheshimu `LC_ALL`, `LC_MESSAGES`, na `LANG` (pamoja na `--lang`), ukitumia Kiingereza kama chaguo-msingi ili miundo ya zana za MCP na majibu yaendelee kuoana na matoleo ya awali.

## Amri

```bash
npm install
npm run build
npm run test
npm run lint
```

## Leseni

Tazama [README kamili ya Kiingereza](../../../README.md) na [LICENSE](../../../LICENSE).

> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Монорепо Model Context Protocol (MCP) сервера за macOS апликације.

## Пакети

- TypeScript радни пакети у директоријуму `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` и `voice-memos`.
- Python пакет у директоријуму `packages/ical` којим се управља помоћу алата `uv`.

## Локализација

Пакет `packages/i18n` (`@somethingwithproof/mcp-i18n`) обезбеђује TypeScript помоћни модул за локализацију без извршних зависности за 48 језичких ознака (20 Tier 1, 15 афричких, 10 азијских и 3 јужнословенске), обухватајући CLI помоћ, дијагностику, поруке о грешкама и локализоване метаподатке. Препознавање језика прати променљиве `LC_ALL`, `LC_MESSAGES` и `LANG` (уз заставицу `--lang`), са енглеским као подразумеваним језиком како би MCP шеме алата и одговори остали компатибилни уназад.

## Команде

```bash
npm install
npm run build
npm run test
npm run lint
```

## Лиценца

Погледајте потпуну [енглеску верзију README](../../../README.md) и датотеку [LICENSE](../../../LICENSE).

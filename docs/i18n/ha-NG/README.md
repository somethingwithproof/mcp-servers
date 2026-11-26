> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Ma'ajiyar lamba guda (monorepo) ta sabobin Model Context Protocol (MCP) don manhajojin macOS.

## Fakiti

- Fakitin wurin aiki na TypeScript a ƙarƙashin `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, da `voice-memos`.
- Fakitin Python a ƙarƙashin `packages/ical` wanda ake sarrafawa da `uv`.

## Daidaita Harshe

`packages/i18n` (`@somethingwithproof/mcp-i18n`) yana samar da mataimakin daidaita harshe na TypeScript wanda ba shi da dogaro a lokacin gudanarwa a harsuna 45 (20 na Mataki na 1, 15 na Afirka, da 10 na Asiya) don taimakon CLI, binciken matsala, saƙonnin kuskure, da bayanan metadata da aka fassara. Gano harshe yana mutunta `LC_ALL`, `LC_MESSAGES`, da `LANG` (tare da `--lang`), yana komawa Turanci a asali domin tsare-tsaren kayan aikin MCP da amsoshi su ci gaba da dacewa da tsofaffin sigogi.

## Umarni

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lasisi

Duba cikakken [README na Turanci](../../../README.md) da [LICENSE](../../../LICENSE).

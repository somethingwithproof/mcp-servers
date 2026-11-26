> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Otu ebe nchekwa nke sava Model Context Protocol (MCP) maka ngwa macOS.

## Ngwugwu

- Ngwugwu ọrụ TypeScript n'okpuru `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, na `voice-memos`.
- Ngwugwu Python n'okpuru `packages/ical` nke e ji `uv` chịkwaa.

## Nkwado asụsụ obodo

`packages/i18n` (`@somethingwithproof/mcp-i18n`) na-enye onye inyeaka ntụgharị asụsụ TypeScript nke na-enweghị ndabere oge mmezu gafee asụsụ obodo 45 (asụsụ Tier 1 20, asụsụ Afrịka 15, na asụsụ Eshia 10) maka enyemaka CLI, nyocha nsogbu, ozi mmejọ, na metadata a sụgharịrị. Nchọpụta asụsụ obodo na-asọpụrụ `LC_ALL`, `LC_MESSAGES`, na `LANG` (yana `--lang`), ma na-amalite na Bekee ka atụmatụ ngwaọrụ MCP na nzaghachi wee nọgide na-adakọ n'azụ.

## Iwu

```bash
npm install
npm run build
npm run test
npm run lint
```

## Ikikere

Lee [README Bekee](../../../README.md) zuru ezu na [LICENSE](../../../LICENSE).

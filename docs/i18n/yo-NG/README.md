> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Ibi-ìpamọ́ alápapọ̀ (monorepo) ti àwọn olùpèsè Model Context Protocol (MCP) fún àwọn ohun-èlò macOS.

## Àwọn àpò-ìṣe

- Àwọn àpò-ìṣe ààyè-iṣẹ́ TypeScript lábẹ́ `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, àti `voice-memos`.
- Àpò-ìṣe Python lábẹ́ `packages/ical` tí a ń ṣàkóso pẹ̀lú `uv`.

## Ìsọdèdè-agbègbè

`packages/i18n` (`@somethingwithproof/mcp-i18n`) ń pèsè olùrànlọ́wọ́ ìsọdèdè-agbègbè TypeScript tí kò ní ìgbẹ́kẹ̀lé àkókò-ìṣiṣẹ́ kankan káàkiri àwọn èdè agbègbè 45 (20 ti Ìpele 1, 15 ti Áfíríkà, àti 10 ti Éṣíà) fún ìrànlọ́wọ́ CLI, àwọn àyẹ̀wò ìṣòro, àwọn ìránṣẹ́ àṣìṣe, àti dátà-ìtọ́ka tí a sọ di ti agbègbè. Ìwárí èdè agbègbè ń tẹ̀lé `LC_ALL`, `LC_MESSAGES`, àti `LANG` (pẹ̀lú `--lang`), ó sì ń bẹ̀rẹ̀ sí èdè Gẹ̀ẹ́sì kí àwọn ìlànà irinṣẹ́ MCP àti àwọn ìdáhùn lè máa bá àwọn ti tẹ́lẹ̀ mu.

## Àwọn àṣẹ

```bash
npm install
npm run build
npm run test
npm run lint
```

## Ìwé-àṣẹ

Wo [README èdè Gẹ̀ẹ́sì](../../../README.md) ní kíkún àti [LICENSE](../../../LICENSE).

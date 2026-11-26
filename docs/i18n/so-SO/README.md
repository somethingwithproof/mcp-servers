> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Hal-kayd oo ka kooban adeegayaasha Model Context Protocol (MCP) ee loogu talagalay codsiyada macOS.

## Xirmooyinka

- Xirmooyinka goobta shaqada ee TypeScript ee ku hoos jira `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, iyo `voice-memos`.
- Xirmada Python ee ku hoos jirta `packages/ical` oo lagu maamulo `uv`.

## Deegaameynta

`packages/i18n` (`@somethingwithproof/mcp-i18n`) waxay bixisaa caawiye deegaameyn TypeScript ah oo aan lahayn wax ku-tiirsanaan waqtiga shaqada ah guud ahaan 45 deegaan (20 Heerka 1-aad, 15 Afrikaan, iyo 10 Aasiyaan ah) oo loogu talagalay caawimada CLI, baaritaanka cilladaha, fariimaha khaladka, iyo xogta dheeraadka ah ee deegaameysan. Ogaanshaha deegaanku wuxuu tixgeliyaa `LC_ALL`, `LC_MESSAGES`, iyo `LANG` (iyo `--lang`), isagoo u noqonaya Ingiriis marka hore si qaab-dhismeedka qalabka MCP iyo jawaabuhu ay ula jaanqaadaan noocyadii hore.

## Amarada

```bash
npm install
npm run build
npm run test
npm run lint
```

## Shatiga

Eeg [README-ga Ingiriisiga](../../../README.md) oo dhammaystiran iyo [LICENSE](../../../LICENSE).

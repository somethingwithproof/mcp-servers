> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

I-monorepo yee-server ze-Model Context Protocol (MCP) zezicelo ze-macOS.

## Iiphakheji

- Iiphakheji zendawo yokusebenza ye-TypeScript phantsi kwe-`packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, kunye ne-`voice-memos`.
- Iphakheji ye-Python phantsi kwe-`packages/ical` elawulwa nge-`uv`.

## Ulungiselelo lweelwimi

I-`packages/i18n` (`@somethingwithproof/mcp-i18n`) ibonelela ngomncedisi wolungiselelo lweelwimi lwe-TypeScript ongenaxhomekeko lexesha lokuqhuba kwiilwimi zasekuhlaleni ezingama-45 (ezingama-20 ze-Tier 1, ezili-15 zase-Afrika, nezili-10 zase-Asia) woncedo lwe-CLI, ukuxilonga, imiyalezo yempazamo, kunye nedatha enge-meta elungiselelwe ulwimi lwasekuhlaleni. Ukufunyanwa kolwimi lwasekuhlaleni kuhlonipha i-`LC_ALL`, `LC_MESSAGES`, kunye ne-`LANG` (kunye ne-`--lang`), kubuyela kwisiNgesi njengokuzenzekelayo ukuze izikimu zezixhobo ze-MCP kunye neempendulo zihlale zihambelana neenguqulelo zangaphambili.

## Imiyalelo

```bash
npm install
npm run build
npm run test
npm run lint
```

## Ilayisensi

Jonga i-[README yesiNgesi](../../../README.md) epheleleyo kunye ne-[LICENSE](../../../LICENSE).

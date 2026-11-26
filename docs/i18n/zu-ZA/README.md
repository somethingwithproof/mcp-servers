> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

I-monorepo yamaseva e-Model Context Protocol (MCP) ezinhlelo zokusebenza ze-macOS.

## Amaphakheji

- Amaphakheji endawo yokusebenza ye-TypeScript ngaphansi kwe-`packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, kanye ne-`voice-memos`.
- Iphakheji ye-Python ngaphansi kwe-`packages/ical` elawulwa nge-`uv`.

## Ukwenziwa ngokwendawo

I-`packages/i18n` (`@somethingwithproof/mcp-i18n`) ihlinzeka ngomsizi we-TypeScript wokwenziwa ngokwendawo ongenakho ukuncika kwesikhathi sokusebenza ezilimini zendawo ezingu-45 (ezingu-20 ze-Tier 1, ezingu-15 zase-Afrika, kanye nezingu-10 zase-Asia) ukuze uthole usizo lwe-CLI, ukuxilonga, imilayezo yamaphutha, kanye nemethadatha eyenziwe ngokwendawo. Ukutholwa kolimi lwendawo kuhlonipha i-`LC_ALL`, i-`LC_MESSAGES`, ne-`LANG` (kanye ne-`--lang`), kubuyela esiNgisini ngokuzenzakalelayo ukuze izikimu zamathuluzi ze-MCP nezimpendulo zihlale zisebenzisana nezinguqulo ezindala.

## Imiyalo

```bash
npm install
npm run build
npm run test
npm run lint
```

## Ilayisense

Bheka [i-README yesiNgisi](../../../README.md) ephelele kanye ne-[LICENSE](../../../LICENSE).

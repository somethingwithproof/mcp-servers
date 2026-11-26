> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo an'ny mpizara Model Context Protocol (MCP) ho an'ny rindranasa macOS.

## Fonosana

- Fonosana toeram-piasana TypeScript ao ambanin'ny `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, ary `voice-memos`.
- Fonosana Python ao ambanin'ny `packages/ical` tantanina amin'ny `uv`.

## Fampifanarahana amin'ny fiteny

`packages/i18n` (`@somethingwithproof/mcp-i18n`) dia manome mpanampy TypeScript ho an'ny fampifanarahana amin'ny fiteny tsy mila fiankinan-doha mandritra ny fampandehanana manerana ny fiteny eo an-toerana miisa 45 (fiteny sokajy 1 miisa 20, fiteny afrikanina miisa 15, ary fiteny aziatika miisa 10) ho an'ny fanampiana CLI, fitiliana, hafatra diso, ary metadata nadika. Ny famantarana ny fiteny dia manaja ny `LC_ALL`, `LC_MESSAGES`, ary `LANG` (miampy `--lang`), ka miverina amin'ny teny anglisy amin'ny fomba mahazatra mba hijanonan'ny rafitra sy ny valin'ny fitaovana MCP ho mifanaraka amin'ny teo aloha.

## Baiko

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lisansa

Jereo ny [README amin'ny teny anglisy](../../../README.md) feno sy ny [LICENSE](../../../LICENSE).

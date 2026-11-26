> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo pelayan Model Context Protocol (MCP) untuk aplikasi macOS.

## Pakej

- Pakej ruang kerja TypeScript di bawah `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, dan `voice-memos`.
- Pakej Python di bawah `packages/ical` diurus dengan `uv`.

## Penyetempatan

`packages/i18n` (`@somethingwithproof/mcp-i18n`) menyediakan pembantu penyetempatan TypeScript tanpa kebergantungan masa jalan merentasi 45 lokal (20 lokal Peringkat 1, 15 lokal Afrika, dan 10 lokal Asia) untuk bantuan CLI, diagnostik, mesej ralat, dan metadata setempat. Pengesanan lokal mematuhi `LC_ALL`, `LC_MESSAGES`, dan `LANG` (serta `--lang`), dengan lalai kepada Bahasa Inggeris supaya skema dan respons alat MCP kekal serasi ke belakang.

## Arahan

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lesen

Lihat [README Bahasa Inggeris](../../../README.md) penuh dan [LICENSE](../../../LICENSE).

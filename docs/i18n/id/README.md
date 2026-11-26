> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

Monorepo server Model Context Protocol (MCP) untuk aplikasi macOS.

## Paket

- Paket workspace TypeScript di bawah `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, dan `voice-memos`.
- Paket Python di bawah `packages/ical` yang dikelola dengan `uv`.

## Pelokalan

`packages/i18n` (`@somethingwithproof/mcp-i18n`) menyediakan helper pelokalan TypeScript tanpa dependensi runtime untuk 45 lokal (20 lokal Tier 1, 15 lokal Afrika, dan 10 lokal Asia) bagi bantuan CLI, diagnostik, pesan galat, dan metadata yang dilokalkan. Deteksi lokal mengikuti `LC_ALL`, `LC_MESSAGES`, dan `LANG` (serta `--lang`), dengan bawaan bahasa Inggris agar skema dan respons alat MCP tetap kompatibel ke belakang.

## Perintah

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lisensi

Lihat [README bahasa Inggris](../../../README.md) lengkap dan [LICENSE](../../../LICENSE).

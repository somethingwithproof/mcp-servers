> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS uygulamaları için Model Context Protocol (MCP) sunucularının bulunduğu monorepo.

## Paketler

- `packages/*` altındaki TypeScript çalışma alanı paketleri: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` ve `voice-memos`.
- `uv` ile yönetilen `packages/ical` altındaki Python paketi.

## Yerelleştirme

`packages/i18n` (`@somethingwithproof/mcp-i18n`), CLI yardımı, tanılama çıktıları, hata iletileri ve yerelleştirilmiş üst veriler için 45 yerel ayar (20 Tier 1, 15 Afrika ve 10 Asya yerel ayarı) genelinde çalışma zamanı bağımlılığı olmayan bir TypeScript yerelleştirme yardımcısı sunar. Yerel ayar algılama `LC_ALL`, `LC_MESSAGES` ve `LANG` değişkenlerini (ayrıca `--lang` bayrağını) dikkate alır; MCP araç şemalarının ve yanıtlarının geriye dönük uyumlu kalması için varsayılan olarak İngilizceye döner.

## Komutlar

```bash
npm install
npm run build
npm run test
npm run lint
```

## Lisans

Tam [İngilizce README](../../../README.md) ve [LICENSE](../../../LICENSE) dosyalarına bakın.

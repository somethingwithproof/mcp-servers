> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS ایپلیکیشنز کے لیے Model Context Protocol (MCP) سرورز کا مونو ریپو۔

## پیکیجز

- `packages/*` کے تحت TypeScript ورک اسپیس پیکیجز: `apple-mail`، `calendar`، `contacts`، `finder`، `home`، `i18n`، `imessage`، `maps`، `music`، `notes`، `photos`، `reminders`، `safari`، `screen-time`، `shortcuts`، اور `voice-memos`۔
- `packages/ical` کے تحت Python پیکیج جسے `uv` کے ذریعے منظم کیا جاتا ہے۔

## لوکلائزیشن

`packages/i18n` (`@somethingwithproof/mcp-i18n`) CLI ہیلپ، تشخیص، ایرر پیغامات اور مقامی میٹا ڈیٹا کے لیے 45 لوکیلز (20 ٹیئر 1، 15 افریقی، اور 10 ایشیائی لوکیلز) میں زیرو رن ٹائم ڈیپنڈنسی TypeScript لوکلائزیشن ہیلپر فراہم کرتا ہے۔ لوکیل کی شناخت `LC_ALL`، `LC_MESSAGES` اور `LANG` (نیز `--lang`) کا احترام کرتی ہے، اور ڈیفالٹ طور پر انگریزی پر رہتی ہے تاکہ MCP ٹول اسکیماز اور جوابات بیک ورڈ کمپیٹیبل رہیں۔

## کمانڈز

```bash
npm install
npm run build
npm run test
npm run lint
```

## لائسنس

مکمل [انگریزی README](../../../README.md) اور [LICENSE](../../../LICENSE) دیکھیں۔

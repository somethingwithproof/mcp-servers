> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

คลังโค้ดรวมของเซิร์ฟเวอร์ Model Context Protocol (MCP) สำหรับแอปพลิเคชันบน macOS

## แพ็กเกจ

- แพ็กเกจเวิร์กสเปซ TypeScript ภายใต้ `packages/*`: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` และ `voice-memos`
- แพ็กเกจ Python ภายใต้ `packages/ical` ที่จัดการด้วย `uv`

## การรองรับภาษาท้องถิ่น

`packages/i18n` (`@somethingwithproof/mcp-i18n`) มอบตัวช่วยการแปลภาษาท้องถิ่นด้วย TypeScript ที่ไม่มีการพึ่งพาไลบรารีขณะรัน ครอบคลุม 45 ภาษาท้องถิ่น (ภาษาท้องถิ่นระดับ Tier 1 จำนวน 20 ภาษา แอฟริกา 15 ภาษา และเอเชีย 10 ภาษา) สำหรับคำอธิบายช่วยเหลือ CLI ข้อมูลการวินิจฉัย ข้อความแสดงข้อผิดพลาด และเมทาดาทาที่แปลแล้ว การตรวจจับภาษาท้องถิ่นจะยึดตาม `LC_ALL`, `LC_MESSAGES` และ `LANG` (รวมถึง `--lang`) โดยใช้ภาษาอังกฤษเป็นค่าเริ่มต้นเพื่อให้โครงร่างเครื่องมือและคำตอบของ MCP ยังคงเข้ากันได้ย้อนหลัง

## คำสั่ง

```bash
npm install
npm run build
npm run test
npm run lint
```

## สัญญาอนุญาต

ดูรายละเอียดเพิ่มเติมได้ที่ [README ภาษาอังกฤษ](../../../README.md) ฉบับเต็มและ [LICENSE](../../../LICENSE)

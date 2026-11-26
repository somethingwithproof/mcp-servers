> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

ለmacOS መተግበሪያዎች የModel Context Protocol (MCP) አገልጋዮች ነጠላ ማከማቻ።

## ጥቅሎች

- በ`packages/*` ስር ያሉ የTypeScript የስራ ቦታ ጥቅሎች፦ `apple-mail`፣ `calendar`፣ `contacts`፣ `finder`፣ `home`፣ `i18n`፣ `imessage`፣ `maps`፣ `music`፣ `notes`፣ `photos`፣ `reminders`፣ `safari`፣ `screen-time`፣ `shortcuts` እና `voice-memos`።
- በ`uv` የሚተዳደር በ`packages/ical` ስር ያለ የPython ጥቅል።

## አካባቢያዊ ትርጉም

`packages/i18n` (`@somethingwithproof/mcp-i18n`) ለCLI እገዛ፣ ለምርመራዎች፣ ለስህተት መልዕክቶች እና ለተተረጎመ ሜታዳታ በ45 አካባቢዎች (20 ደረጃ 1፣ 15 የአፍሪካ እና 10 የእስያ አካባቢዎች) ላይ ምንም የአሂድ-ጊዜ ጥገኝነት የሌለው የTypeScript አካባቢያዊ ትርጉም አጋዥ ያቀርባል። የአካባቢ መለየት `LC_ALL`፣ `LC_MESSAGES` እና `LANG` የተባሉትን (እንዲሁም `--lang`) ያከብራል፣ የMCP መሳሪያ ንድፎች እና ምላሾች ከቀድሞ ጋር ተኳሃኝ ሆነው እንዲቆዩ በነባሪነት እንግሊዝኛን ይጠቀማል።

## ትዕዛዞች

```bash
npm install
npm run build
npm run test
npm run lint
```

## ፈቃድ

ሙሉውን [የእንግሊዝኛ README](../../../README.md) እና [LICENSE](../../../LICENSE) ይመልከቱ።

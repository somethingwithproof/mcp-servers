> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS అప్లికేషన్‌ల కోసం Model Context Protocol (MCP) సర్వర్ల మోనోరిపో.

## ప్యాకేజీలు

- `packages/*` క్రింద TypeScript వర్క్‌స్పేస్ ప్యాకేజీలు: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, మరియు `voice-memos`.
- `uv` తో నిర్వహించబడే `packages/ical` క్రింది Python ప్యాకేజీ.

## స్థానికీకరణ

`packages/i18n` (`@somethingwithproof/mcp-i18n`) CLI సహాయం, డయాగ్నోస్టిక్స్, దోష సందేశాలు, మరియు స్థానికీకరించిన మెటాడేటా కోసం 45 లోకేల్స్‌లో (20 టియర్ 1, 15 ఆఫ్రికన్, మరియు 10 ఆసియా లోకేల్స్) రన్‌టైమ్ డిపెండెన్సీ లేని TypeScript స్థానికీకరణ సహాయకుడిని అందిస్తుంది. లోకేల్ గుర్తింపు `LC_ALL`, `LC_MESSAGES`, మరియు `LANG` (అలాగే `--lang`) లను అనుసరిస్తుంది, MCP టూల్ స్కీమాలు మరియు ప్రతిస్పందనలు పాత వెర్షన్లతో అనుకూలంగా ఉండేలా ఆంగ్లాన్ని డిఫాల్ట్‌గా ఉంచుతుంది.

## ఆదేశాలు

```bash
npm install
npm run build
npm run test
npm run lint
```

## లైసెన్స్

పూర్తి [ఆంగ్ల README](../../../README.md) మరియు [LICENSE](../../../LICENSE) ను చూడండి.

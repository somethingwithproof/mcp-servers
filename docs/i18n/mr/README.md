> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS अ‍ॅप्लिकेशन्ससाठी Model Context Protocol (MCP) सर्व्हर्सचा मोनोरेपो.

## पॅकेजेस

- `packages/*` अंतर्गत TypeScript वर्कस्पेस पॅकेजेस: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` आणि `voice-memos`.
- `uv` ने व्यवस्थापित केलेले `packages/ical` अंतर्गत Python पॅकेज.

## स्थानिकीकरण

`packages/i18n` (`@somethingwithproof/mcp-i18n`) CLI मदत, निदान, त्रुटी संदेश आणि स्थानिकीकृत मेटाडेटासाठी 45 लोकॅल्समध्ये (20 टियर 1, 15 आफ्रिकन आणि 10 आशियाई लोकॅल्स) झिरो-रनटाइम-अवलंबित्व TypeScript स्थानिकीकरण मदतनीस प्रदान करते. लोकॅल ओळख `LC_ALL`, `LC_MESSAGES` आणि `LANG` (तसेच `--lang`) चे पालन करते आणि डीफॉल्टनुसार इंग्रजी वापरते जेणेकरून MCP टूल स्कीमा आणि प्रतिसाद बॅकवर्ड-कॉम्पॅटिबल राहतील.

## कमांड्स

```bash
npm install
npm run build
npm run test
npm run lint
```

## परवाना

संपूर्ण [इंग्रजी README](../../../README.md) आणि [LICENSE](../../../LICENSE) पहा.

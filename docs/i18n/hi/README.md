> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS अनुप्रयोगों के लिए Model Context Protocol (MCP) सर्वरों का मोनोरेपो।

## पैकेज

- `packages/*` के अंतर्गत TypeScript वर्कस्पेस पैकेज: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts`, और `voice-memos`।
- `uv` के साथ प्रबंधित `packages/ical` के अंतर्गत Python पैकेज।

## स्थानीयकरण

`packages/i18n` (`@somethingwithproof/mcp-i18n`) CLI सहायता, निदान, त्रुटि संदेशों और स्थानीयकृत मेटाडेटा के लिए 45 लोकेल (20 टियर 1, 15 अफ़्रीकी और 10 एशियाई लोकेल) में शून्य-रनटाइम-निर्भरता वाला TypeScript स्थानीयकरण हेल्पर प्रदान करता है। लोकेल पहचान `LC_ALL`, `LC_MESSAGES` और `LANG` (साथ ही `--lang`) का सम्मान करती है, और डिफ़ॉल्ट रूप से अंग्रेज़ी चुनती है ताकि MCP टूल स्कीमा और प्रतिक्रियाएँ पूर्वव्यापी रूप से संगत बनी रहें।

## कमांड

```bash
npm install
npm run build
npm run test
npm run lint
```

## लाइसेंस

पूर्ण [अंग्रेज़ी README](../../../README.md) और [LICENSE](../../../LICENSE) देखें।

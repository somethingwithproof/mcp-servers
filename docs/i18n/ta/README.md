> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS பயன்பாடுகளுக்கான Model Context Protocol (MCP) சேவையகங்களின் ஒற்றைக் களஞ்சியம்.

## தொகுப்புகள்

- `packages/*` கீழ் உள்ள TypeScript பணியிடத் தொகுப்புகள்: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` மற்றும் `voice-memos`.
- `uv` கொண்டு நிர்வகிக்கப்படும் `packages/ical` கீழ் உள்ள Python தொகுப்பு.

## உள்ளூர்மயமாக்கல்

`packages/i18n` (`@somethingwithproof/mcp-i18n`) ஆனது CLI உதவி, கண்டறிதல்கள், பிழைச் செய்திகள் மற்றும் உள்ளூர்மயமாக்கப்பட்ட மேல்நிலைத் தரவுகளுக்காக 45 மொழியிடங்களில் (20 Tier 1, 15 ஆப்பிரிக்க மற்றும் 10 ஆசிய மொழியிடங்கள்) இயக்க நேரச் சார்பில்லாத TypeScript உள்ளூர்மயமாக்கல் உதவியாளரை வழங்குகிறது. மொழியிடக் கண்டறிதல் `LC_ALL`, `LC_MESSAGES` மற்றும் `LANG` (மற்றும் `--lang`) ஆகியவற்றைப் பின்பற்றுகிறது; MCP கருவித் திட்டங்களும் பதில்களும் முந்தைய பதிப்புகளுடன் இணக்கமாக இருக்க இயல்பாக ஆங்கிலத்தைப் பயன்படுத்துகிறது.

## கட்டளைகள்

```bash
npm install
npm run build
npm run test
npm run lint
```

## உரிமம்

முழுமையான [ஆங்கில README](../../../README.md) மற்றும் [LICENSE](../../../LICENSE) ஆகியவற்றைப் பார்க்கவும்.

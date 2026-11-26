> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

macOS অ্যাপ্লিকেশনের জন্য Model Context Protocol (MCP) সার্ভারগুলোর মনোরিপো।

## প্যাকেজসমূহ

- `packages/*`-এর অধীনে TypeScript ওয়ার্কস্পেস প্যাকেজসমূহ: `apple-mail`, `calendar`, `contacts`, `finder`, `home`, `i18n`, `imessage`, `maps`, `music`, `notes`, `photos`, `reminders`, `safari`, `screen-time`, `shortcuts` এবং `voice-memos`।
- `uv` দিয়ে পরিচালিত `packages/ical`-এর অধীনে Python প্যাকেজ।

## স্থানীয়করণ

`packages/i18n` (`@somethingwithproof/mcp-i18n`) CLI সাহায্য, ডায়াগনস্টিকস, ত্রুটি বার্তা এবং স্থানীয়কৃত মেটাডেটার জন্য ৪৫টি লোকেল (২০টি Tier 1, ১৫টি আফ্রিকান এবং ১০টি এশীয় লোকেল) জুড়ে শূন্য-রানটাইম-নির্ভরতার একটি TypeScript স্থানীয়করণ সহায়ক প্রদান করে। লোকেল শনাক্তকরণ `LC_ALL`, `LC_MESSAGES` এবং `LANG` (এবং `--lang`) অনুসরণ করে এবং ডিফল্টরূপে ইংরেজি থাকে যাতে MCP টুল স্কিমা ও রেসপন্সগুলো পূর্বের সংস্করণের সাথে সামঞ্জস্যপূর্ণ থাকে।

## কমান্ডসমূহ

```bash
npm install
npm run build
npm run test
npm run lint
```

## লাইসেন্স

সম্পূর্ণ [ইংরেজি README](../../../README.md) এবং [LICENSE](../../../LICENSE) দেখুন।

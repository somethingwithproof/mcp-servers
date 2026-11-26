> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

مستودع موحّد (monorepo) لخوادم Model Context Protocol (MCP) لتطبيقات macOS.

## الحزم (Packages)

- حزم مساحة عمل TypeScript تحت `packages/*`: `apple-mail` و`calendar` و`contacts` و`finder` و`home` و`i18n` و`imessage` و`maps` و`music` و`notes` و`photos` و`reminders` و`safari` و`screen-time` و`shortcuts` و`voice-memos`.
- حزمة Python تحت `packages/ical` بتتدار باستخدام `uv`.

## اللغات والترجمة

حزمة `packages/i18n` (`@somethingwithproof/mcp-i18n`) بتوفر أداة مساعدة للتوطين بلغة TypeScript من غير أي اعتماديات وقت التشغيل (zero-runtime-dependency) لـ 45 لغة وإعداد محلي (20 من الفئة الأولى Tier 1، و15 لغة أفريقية، و10 لغات آسيوية) لرسائل مساعدة الـ CLI والتشخيصات ورسائل الأخطاء والبيانات الوصفية المترجمة. اكتشاف اللغة بيتبع `LC_ALL` و`LC_MESSAGES` و`LANG` (وكمان `--lang`)، وبيرجع للإنجليزية كخيار افتراضي عشان مخططات أدوات MCP واستجاباتها تفضل متوافقة مع الإصدارات السابقة.

## الأوامر

```bash
npm install
npm run build
npm run test
npm run lint
```

## الترخيص

شوف [ملف README الإنجليزي](../../../README.md) الكامل وملف [LICENSE](../../../LICENSE).

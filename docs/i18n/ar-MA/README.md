> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

مستودع موحد (Monorepo) لخوادم بروتوكول سياق النموذج (MCP) لتطبيقات macOS.

## الحزم

- حزم مساحة عمل TypeScript ضمن `packages/*`: `apple-mail`، `calendar`، `contacts`، `finder`، `home`، `i18n`، `imessage`، `maps`، `music`، `notes`، `photos`، `reminders`، `safari`، `screen-time`، `shortcuts`، و`voice-memos`.
- حزمة Python ضمن `packages/ical` تدار عبر `uv`.

## التوطين

توفر `packages/i18n` (`@somethingwithproof/mcp-i18n`) أداة مساعدة للتوطين بلغة TypeScript دون تبعيات وقت التشغيل عبر 45 لغة محلية (20 من المستوى 1، و15 لغة إفريقية، و10 لغات آسيوية) لمساعدة سطر الأوامر والتشخيص ورسائل الخطأ والبيانات الوصفية المترجمة. يحترم كشف اللغة متغيرات `LC_ALL` و`LC_MESSAGES` و`LANG` (بالإضافة إلى `--lang`)، مع اعتماد الإنجليزية افتراضيا حتى تبقى مخططات أدوات MCP واستجاباتها متوافقة مع الإصدارات السابقة.

## الأوامر

```bash
npm install
npm run build
npm run test
npm run lint
```

## الترخيص

راجع [ملف README الإنجليزي الكامل](../../../README.md) و[LICENSE](../../../LICENSE).

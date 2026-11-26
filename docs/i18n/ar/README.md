> [English](../../../README.md)

# mcp-servers

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/somethingwithproof/mcp-servers/badge)](https://scorecard.dev/viewer/?uri=github.com/somethingwithproof/mcp-servers)

مستودع موحّد لخوادم بروتوكول سياق النموذج (MCP) لتطبيقات macOS.

## الحزم

- حزم مساحة عمل TypeScript ضمن `packages/*`: `apple-mail`، و`calendar`، و`contacts`، و`finder`، و`home`، و`i18n`، و`imessage`، و`maps`، و`music`، و`notes`، و`photos`، و`reminders`، و`safari`، و`screen-time`، و`shortcuts`، و`voice-memos`.
- حزمة Python ضمن `packages/ical` تُدار باستخدام `uv`.

## التوطين

توفّر `packages/i18n` (`@somethingwithproof/mcp-i18n`) أداةً مساعدةً للتوطين بلغة TypeScript دون أي اعتماديات في وقت التشغيل عبر 45 لغةً وإعدادًا محليًا (20 لغةً من المستوى الأول، و15 لغةً أفريقيةً، و10 لغاتٍ آسيويةٍ) لمساعدة سطر الأوامر، والتشخيصات، ورسائل الأخطاء، والبيانات الوصفية الموطّنة. يحترم اكتشاف اللغة متغيّرات `LC_ALL` و`LC_MESSAGES` و`LANG` (إضافةً إلى `--lang`)، مع اعتماد الإنجليزية افتراضيًا لضمان بقاء مخططات أدوات MCP واستجاباتها متوافقةً مع الإصدارات السابقة.

## الأوامر

```bash
npm install
npm run build
npm run test
npm run lint
```

## الترخيص

راجع [ملف README الإنجليزي الكامل](../../../README.md) و[LICENSE](../../../LICENSE).

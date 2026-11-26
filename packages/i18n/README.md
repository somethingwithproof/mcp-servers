# @somethingwithproof/mcp-i18n

Zero-dependency localization helper shared by macOS MCP servers in this monorepo, supporting 20 Broad Tier 1 locales (`en`, `de`, `es`, `fr`, `it`, `pt-BR`, `nl`, `ru`, `uk`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`, `hi`, `pl`, `tr`, `sv`, `vi`, `id`).

## Usage

```ts
import {
  createTranslator,
  extractLangFlag,
} from "@somethingwithproof/mcp-i18n";

const i18n = createTranslator(extractLangFlag(process.argv.slice(2)));
console.error(i18n.t("server.starting", { name: "maps-mcp" }));
```

Locale detection follows POSIX precedence (`LC_ALL`, then `LC_MESSAGES`, then `LANG`). Unset, `C`, `POSIX`, and unrecognized locales default to English so MCP tool schemas and default responses remain backward-compatible.

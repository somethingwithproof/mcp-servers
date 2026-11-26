# @somethingwithproof/mcp-i18n

Zero-dependency localization helper shared by macOS MCP servers in this monorepo, supporting 45 locales: 20 Tier 1 (`en`, `de`, `es`, `fr`, `it`, `pt-BR`, `nl`, `ru`, `uk`, `ja`, `ko`, `zh-CN`, `zh-TW`, `ar`, `hi`, `pl`, `tr`, `sv`, `vi`, `id`), 15 African (`af-ZA`, `am-ET`, `ar-EG`, `ar-MA`, `fr-MA`, `fr-SN`, `ha-NG`, `ig-NG`, `mg-MG`, `rw-RW`, `so-SO`, `sw-KE`, `xh-ZA`, `yo-NG`, `zu-ZA`), and 10 Asian (`bn`, `fa`, `he`, `mr`, `ta`, `te`, `th`, `ur`, `ms`, `fil`), with RTL support for `ar`, `ar-EG`, `ar-MA`, `fa`, `he`, and `ur`.

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

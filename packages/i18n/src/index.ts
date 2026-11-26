// SPDX-FileCopyrightText: 2026 Thomas Vincent <thomasvincent@gmail.com>
// SPDX-License-Identifier: MIT

import ar from "./locales/ar.json" with { type: "json" };
import de from "./locales/de.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };
import hi from "./locales/hi.json" with { type: "json" };
import id from "./locales/id.json" with { type: "json" };
import it from "./locales/it.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };
import ko from "./locales/ko.json" with { type: "json" };
import nl from "./locales/nl.json" with { type: "json" };
import pl from "./locales/pl.json" with { type: "json" };
import ptBR from "./locales/pt-BR.json" with { type: "json" };
import ru from "./locales/ru.json" with { type: "json" };
import sv from "./locales/sv.json" with { type: "json" };
import tr from "./locales/tr.json" with { type: "json" };
import uk from "./locales/uk.json" with { type: "json" };
import vi from "./locales/vi.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };
import zhTW from "./locales/zh-TW.json" with { type: "json" };

export const SUPPORTED_LOCALES = [
  "en",
  "de",
  "es",
  "fr",
  "it",
  "pt-BR",
  "nl",
  "ru",
  "uk",
  "ja",
  "ko",
  "zh-CN",
  "zh-TW",
  "ar",
  "hi",
  "pl",
  "tr",
  "sv",
  "vi",
  "id",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type MessageKey = keyof typeof en;
export type MessageCatalog = Record<MessageKey, string>;

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  nl: "Nederlands",
  ru: "Русский",
  uk: "Українська",
  ja: "日本語",
  ko: "한국어",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ar: "العربية",
  hi: "हिन्दी",
  pl: "Polski",
  tr: "Türkçe",
  sv: "Svenska",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
};

const CATALOGS: Record<Locale, MessageCatalog> = {
  en,
  de,
  es,
  fr,
  it,
  "pt-BR": ptBR,
  nl,
  ru,
  uk,
  ja,
  ko,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ar,
  hi,
  pl,
  tr,
  sv,
  vi,
  id,
};

export function isRtl(locale: string): boolean {
  return resolveLocale(locale) === "ar";
}

export function resolveLocale(tag: string | null | undefined): Locale {
  if (!tag || typeof tag !== "string") return "en";
  const clean = tag.trim().split(/[.@]/)[0]?.replaceAll("_", "-") ?? "";
  const lower = clean.toLowerCase();
  if (!lower || lower === "c" || lower === "posix") return "en";

  if (
    lower === "zh-tw" ||
    lower === "zh-hk" ||
    lower === "zh-mo" ||
    lower === "zh-hant" ||
    lower.startsWith("zh-hant-")
  ) {
    return "zh-TW";
  }
  if (
    lower === "zh" ||
    lower === "zh-cn" ||
    lower === "zh-sg" ||
    lower === "zh-hans" ||
    lower.startsWith("zh-hans-")
  ) {
    return "zh-CN";
  }
  if (lower === "pt" || lower === "pt-br") return "pt-BR";

  for (const loc of SUPPORTED_LOCALES) {
    if (loc.toLowerCase() === lower) return loc;
  }

  const base = lower.split("-")[0] ?? "";
  if (base === "zh") {
    if (
      lower.includes("hant") ||
      lower.includes("-tw") ||
      lower.includes("-hk") ||
      lower.includes("-mo")
    ) {
      return "zh-TW";
    }
    return "zh-CN";
  }
  if (base === "pt") return "pt-BR";

  for (const loc of SUPPORTED_LOCALES) {
    if (loc.toLowerCase() === base) return loc;
  }
  return "en";
}

/**
 * Detects the active locale from POSIX environment variables in standard
 * precedence order: LC_ALL, then LC_MESSAGES, then LANG.
 */
export function detectLocale(env: NodeJS.ProcessEnv = process.env): Locale {
  for (const key of ["LC_ALL", "LC_MESSAGES", "LANG"] as const) {
    const value = env[key]?.trim();
    if (value) return resolveLocale(value);
  }
  return "en";
}

/**
 * Extracts an optional --lang <locale> or --lang=<locale> CLI override.
 */
export function extractLangFlag(argv: readonly string[]): string | undefined {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--lang" && i + 1 < argv.length) {
      return argv[i + 1];
    }
    if (arg?.startsWith("--lang=")) {
      return arg.slice("--lang=".length);
    }
  }
  return undefined;
}

export function getCatalog(locale: Locale = "en"): MessageCatalog {
  return CATALOGS[locale] ?? CATALOGS.en;
}

export function t(
  key: MessageKey | string,
  params?: Record<string, string | number>,
  locale?: string,
): string {
  const resolved = locale ? resolveLocale(locale) : detectLocale();
  const catalog = CATALOGS[resolved] as Record<string, string>;
  const fallback = CATALOGS.en as Record<string, string>;
  let template = catalog[key] ?? fallback[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      template = template.replaceAll(`{${name}}`, String(value));
    }
  }
  return template;
}

export interface Translator {
  readonly locale: Locale;
  readonly rtl: boolean;
  t(key: MessageKey | string, params?: Record<string, string | number>): string;
  formatHelp(options: {
    command: string;
    app: string;
    version: string;
  }): string;
}

export function createTranslator(
  override?: string,
  env: NodeJS.ProcessEnv = process.env,
): Translator {
  const locale = override?.trim() ? resolveLocale(override) : detectLocale(env);
  const rtl = isRtl(locale);
  const translate = (
    key: MessageKey | string,
    params?: Record<string, string | number>,
  ) => t(key, params, locale);

  return {
    locale,
    rtl,
    t: translate,
    formatHelp({ command, app, version }) {
      return [
        translate("meta.server_info", { name: command, version }),
        translate("cli.help_description", { app }),
        "",
        translate("cli.usage", { command }),
        "",
        translate("cli.options"),
        `  --help       ${translate("cli.opt.help")}`,
        `  --version    ${translate("cli.opt.version")}`,
        `  --lang       ${translate("cli.opt.lang")}`,
      ].join("\n");
    },
  };
}

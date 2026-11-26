// SPDX-FileCopyrightText: 2026 Thomas Vincent <thomasvincent@gmail.com>
// SPDX-License-Identifier: MIT

import afZA from "./locales/af-ZA.json" with { type: "json" };
import amET from "./locales/am-ET.json" with { type: "json" };
import ar from "./locales/ar.json" with { type: "json" };
import arEG from "./locales/ar-EG.json" with { type: "json" };
import arMA from "./locales/ar-MA.json" with { type: "json" };
import bn from "./locales/bn.json" with { type: "json" };
import bs from "./locales/bs.json" with { type: "json" };
import de from "./locales/de.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import fa from "./locales/fa.json" with { type: "json" };
import fil from "./locales/fil.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };
import frMA from "./locales/fr-MA.json" with { type: "json" };
import frSN from "./locales/fr-SN.json" with { type: "json" };
import haNG from "./locales/ha-NG.json" with { type: "json" };
import he from "./locales/he.json" with { type: "json" };
import hi from "./locales/hi.json" with { type: "json" };
import hr from "./locales/hr.json" with { type: "json" };
import id from "./locales/id.json" with { type: "json" };
import igNG from "./locales/ig-NG.json" with { type: "json" };
import it from "./locales/it.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };
import ko from "./locales/ko.json" with { type: "json" };
import mgMG from "./locales/mg-MG.json" with { type: "json" };
import mr from "./locales/mr.json" with { type: "json" };
import ms from "./locales/ms.json" with { type: "json" };
import nl from "./locales/nl.json" with { type: "json" };
import pl from "./locales/pl.json" with { type: "json" };
import ptBR from "./locales/pt-BR.json" with { type: "json" };
import ru from "./locales/ru.json" with { type: "json" };
import rwRW from "./locales/rw-RW.json" with { type: "json" };
import soSO from "./locales/so-SO.json" with { type: "json" };
import sr from "./locales/sr.json" with { type: "json" };
import sv from "./locales/sv.json" with { type: "json" };
import swKE from "./locales/sw-KE.json" with { type: "json" };
import ta from "./locales/ta.json" with { type: "json" };
import te from "./locales/te.json" with { type: "json" };
import th from "./locales/th.json" with { type: "json" };
import tr from "./locales/tr.json" with { type: "json" };
import uk from "./locales/uk.json" with { type: "json" };
import ur from "./locales/ur.json" with { type: "json" };
import vi from "./locales/vi.json" with { type: "json" };
import xhZA from "./locales/xh-ZA.json" with { type: "json" };
import yoNG from "./locales/yo-NG.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };
import zhTW from "./locales/zh-TW.json" with { type: "json" };
import zuZA from "./locales/zu-ZA.json" with { type: "json" };

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
  "af-ZA",
  "am-ET",
  "ar-EG",
  "ar-MA",
  "fr-MA",
  "fr-SN",
  "ha-NG",
  "ig-NG",
  "mg-MG",
  "rw-RW",
  "so-SO",
  "sw-KE",
  "xh-ZA",
  "yo-NG",
  "zu-ZA",
  "bn",
  "fa",
  "he",
  "mr",
  "ta",
  "te",
  "th",
  "ur",
  "ms",
  "fil",
  "bs",
  "hr",
  "sr",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type MessageKey = keyof typeof en;
export type MessageCatalog = Record<MessageKey, string>;

const RTL_LOCALES = new Set<Locale>(["ar", "ar-EG", "ar-MA", "fa", "he", "ur"]);

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
  "af-ZA": "Afrikaans (Suid-Afrika)",
  "am-ET": "አማርኛ (ኢትዮጵያ)",
  "ar-EG": "العربية (مصر)",
  "ar-MA": "العربية (المغرب)",
  "fr-MA": "Français (Maroc)",
  "fr-SN": "Français (Sénégal)",
  "ha-NG": "Hausa (Najeriya)",
  "ig-NG": "Igbo (Naịjịrịa)",
  "mg-MG": "Malagasy (Madagasikara)",
  "rw-RW": "Kinyarwanda (U Rwanda)",
  "so-SO": "Soomaali (Soomaaliya)",
  "sw-KE": "Kiswahili (Kenya)",
  "xh-ZA": "isiXhosa (uMzantsi Afrika)",
  "yo-NG": "Yorùbá (Nàìjíríà)",
  "zu-ZA": "isiZulu (iNingizimu Afrika)",
  bn: "বাংলা",
  fa: "فارسی",
  he: "עברית",
  mr: "मराठी",
  ta: "தமிழ்",
  te: "తెలుగు",
  th: "ไทย",
  ur: "اردو",
  ms: "Bahasa Melayu",
  fil: "Filipino",
  bs: "Bosanski",
  hr: "Hrvatski",
  sr: "Српски",
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
  "af-ZA": afZA,
  "am-ET": amET,
  "ar-EG": arEG,
  "ar-MA": arMA,
  "fr-MA": frMA,
  "fr-SN": frSN,
  "ha-NG": haNG,
  "ig-NG": igNG,
  "mg-MG": mgMG,
  "rw-RW": rwRW,
  "so-SO": soSO,
  "sw-KE": swKE,
  "xh-ZA": xhZA,
  "yo-NG": yoNG,
  "zu-ZA": zuZA,
  bn,
  fa,
  he,
  mr,
  ta,
  te,
  th,
  ur,
  ms,
  fil,
  bs,
  hr,
  sr,
};

const BASE_ALIASES: Record<string, Locale> = {
  af: "af-ZA",
  am: "am-ET",
  ha: "ha-NG",
  ig: "ig-NG",
  in: "id",
  iw: "he",
  mg: "mg-MG",
  pt: "pt-BR",
  rw: "rw-RW",
  so: "so-SO",
  sw: "sw-KE",
  tl: "fil",
  xh: "xh-ZA",
  yo: "yo-NG",
  zu: "zu-ZA",
};

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(resolveLocale(locale));
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

  for (const loc of SUPPORTED_LOCALES) {
    if (loc.toLowerCase() === lower) return loc;
  }

  const base = lower.split("-")[0] ?? "";
  if (base === "zh") {
    if (lower.includes("-hans")) return "zh-CN";
    if (
      lower.includes("-hant") ||
      lower.includes("-tw") ||
      lower.includes("-hk") ||
      lower.includes("-mo")
    ) {
      return "zh-TW";
    }
    return "zh-CN";
  }
  if (Object.hasOwn(BASE_ALIASES, base)) {
    return BASE_ALIASES[base] ?? "en";
  }

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
  let lang: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") break;
    if (arg === "--lang" && i + 1 < argv.length) {
      const next = argv[i + 1];
      if (next === "--") break;
      lang = next;
      i += 1;
      continue;
    }
    if (arg?.startsWith("--lang=")) {
      lang = arg.slice("--lang=".length);
    }
  }
  return lang;
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
  const template = Object.hasOwn(catalog, key)
    ? catalog[key]
    : Object.hasOwn(fallback, key)
      ? fallback[key]
      : key;
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
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

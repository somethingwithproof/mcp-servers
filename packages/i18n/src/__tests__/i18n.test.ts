// SPDX-FileCopyrightText: 2026 Thomas Vincent <thomasvincent@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";
import {
  createTranslator,
  detectLocale,
  extractLangFlag,
  getCatalog,
  isRtl,
  LOCALE_NAMES,
  resolveLocale,
  SUPPORTED_LOCALES,
  t,
} from "../index.js";

const PLACEHOLDER_RE = /\{[a-zA-Z0-9_]+\}/g;
const placeholders = (value: string) =>
  [...value.matchAll(PLACEHOLDER_RE)].map((m) => m[0]).sort();

describe("@somethingwithproof/mcp-i18n", () => {
  it("loads all 45 locales with 100% key and placeholder parity", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(45);
    const en = getCatalog("en");
    const enKeys = Object.keys(en).sort();
    expect(enKeys.length).toBeGreaterThan(0);

    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      const catalog = getCatalog(locale);
      expect(Object.keys(catalog).sort()).toEqual(enKeys);
      for (const key of enKeys) {
        const k = key as keyof typeof en;
        expect(catalog[k].trim().length).toBeGreaterThan(0);
        expect(placeholders(catalog[k])).toEqual(placeholders(en[k]));
      }
    }
  });

  it("resolves POSIX and BCP-47 tags and flags all 6 RTL locales", () => {
    expect(resolveLocale("")).toBe("en");
    expect(resolveLocale("C")).toBe("en");
    expect(resolveLocale("POSIX")).toBe("en");
    expect(resolveLocale("C.UTF-8")).toBe("en");
    expect(resolveLocale("de_DE.UTF-8")).toBe("de");
    expect(resolveLocale("pt_BR.UTF-8")).toBe("pt-BR");
    expect(resolveLocale("zh_CN.UTF-8")).toBe("zh-CN");
    expect(resolveLocale("zh_TW.UTF-8")).toBe("zh-TW");
    expect(resolveLocale("zh-Hant-HK")).toBe("zh-TW");
    expect(resolveLocale("ar_SA.UTF-8")).toBe("ar");
    expect(resolveLocale("ar_EG.UTF-8")).toBe("ar-EG");
    expect(resolveLocale("ar_MA.UTF-8")).toBe("ar-MA");
    expect(resolveLocale("fr_SN.UTF-8")).toBe("fr-SN");
    expect(resolveLocale("sw")).toBe("sw-KE");
    expect(resolveLocale("yo_NG.UTF-8")).toBe("yo-NG");
    expect(resolveLocale("fa_IR.UTF-8")).toBe("fa");
    expect(resolveLocale("he_IL.UTF-8")).toBe("he");
    expect(resolveLocale("iw")).toBe("he");
    expect(resolveLocale("ur_PK.UTF-8")).toBe("ur");
    expect(resolveLocale("tl_PH.UTF-8")).toBe("fil");
    expect(resolveLocale("hi_IN.UTF-8")).toBe("hi");
    expect(resolveLocale("xx_YY")).toBe("en");

    const rtlLocales = new Set(["ar", "ar-EG", "ar-MA", "fa", "he", "ur"]);
    for (const locale of SUPPORTED_LOCALES) {
      expect(isRtl(locale)).toBe(rtlLocales.has(locale));
    }
  });

  it("honors LC_ALL > LC_MESSAGES > LANG precedence", () => {
    expect(detectLocale({ LANG: "ja_JP.UTF-8" })).toBe("ja");
    expect(
      detectLocale({ LANG: "ja_JP.UTF-8", LC_MESSAGES: "fr_FR.UTF-8" }),
    ).toBe("fr");
    expect(
      detectLocale({
        LANG: "ja_JP.UTF-8",
        LC_MESSAGES: "fr_FR.UTF-8",
        LC_ALL: "C",
      }),
    ).toBe("en");
    expect(detectLocale({})).toBe("en");
  });

  it("extracts --lang CLI overrides and formats localized help", () => {
    expect(extractLangFlag(["--lang", "uk"])).toBe("uk");
    expect(extractLangFlag(["--lang=zh-TW"])).toBe("zh-TW");
    expect(extractLangFlag(["--help"])).toBeUndefined();

    const enTr = createTranslator("en");
    expect(enTr.locale).toBe("en");
    expect(enTr.rtl).toBe(false);
    expect(enTr.t("err.unknown_tool", { tool: "maps_open" })).toBe(
      "Unknown tool: maps_open",
    );
    expect(
      enTr.formatHelp({
        command: "maps-mcp",
        app: "Apple Maps",
        version: "1.0.0",
      }),
    ).toContain("Usage: maps-mcp [options]");

    const arTr = createTranslator("ar");
    expect(arTr.locale).toBe("ar");
    expect(arTr.rtl).toBe(true);
    expect(arTr.t("err.unknown_tool", { tool: "maps_open" })).toContain(
      "maps_open",
    );
    expect(t("nonexistent.key", undefined, "en")).toBe("nonexistent.key");
  });
});

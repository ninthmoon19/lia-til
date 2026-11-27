"use client";

// Bilingual UI for the Launch Path tab. English source strings are the keys;
// zh/*.ts map them to Chinese. t("Day {n} of {total}", { n, total }) fills
// {placeholders} after the lookup, so word order can differ per language.
// The choice is kept per browser (see prefs.ts).

import { createContext, useContext, type ReactNode } from "react";
import { pD } from "./plan";
import { makePref } from "./prefs";
import { ZH_APP } from "./zh/app";
import { ZH_CHARTS } from "./zh/charts";
import { ZH_DATA } from "./zh/data";
import { ZH_STATIC } from "./zh/static";

export type Lang = "en" | "zh";
export type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;
export type I18n = {
  lang: Lang;
  t: T;
  /** "Nov 18, 2026" / "2026年11月18日" */
  fmt: (isoDate: string) => string;
  /** "Nov 18" / "11月18日" */
  fmtS: (isoDate: string) => string;
};

const ZH: Record<string, string> = { ...ZH_DATA, ...ZH_STATIC, ...ZH_CHARTS, ...ZH_APP };

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;

export function translate(lang: Lang, key: string, vars?: Vars): string {
  return fill(lang === "zh" ? (ZH[key] ?? key) : key, vars);
}

function make(lang: Lang): I18n {
  const loc = lang === "zh" ? "zh-CN" : "en-US";
  return {
    lang,
    t: (key, vars) => translate(lang, key, vars),
    fmt: (s) => pD(s).toLocaleDateString(loc, { month: "short", day: "numeric", year: "numeric" }),
    fmtS: (s) => pD(s).toLocaleDateString(loc, { month: "short", day: "numeric" }),
  };
}
const BY_LANG: Record<Lang, I18n> = { en: make("en"), zh: make("zh") };

const Ctx = createContext<I18n>(BY_LANG.en);
export const useT = () => useContext(Ctx);
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={BY_LANG[lang]}>{children}</Ctx.Provider>;
}

// ---- stored choice -------------------------------------------------------------
const langPref = makePref<Lang>("lp-lang", ["en", "zh"], "en");
export const useStoredLang = langPref.use;
export const setStoredLang = langPref.set;

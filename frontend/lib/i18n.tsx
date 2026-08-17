"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { LANGUAGES, LANGUAGE_LIST, LanguageConfig } from "@/lib/languages";

import en from "@/locales/en.json";
import as from "@/locales/as.json";
import bn from "@/locales/bn.json";
import gu from "@/locales/gu.json";
import hi from "@/locales/hi.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";
import mr from "@/locales/mr.json";
import ne from "@/locales/ne.json";
import orLocale from "@/locales/or.json";
import pa from "@/locales/pa.json";
import sa from "@/locales/sa.json";
import ta from "@/locales/ta.json";
import te from "@/locales/te.json";
import ur from "@/locales/ur.json";

const TRANSLATION_MAP: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  as: as as Record<string, string>,
  bn: bn as Record<string, string>,
  gu: gu as Record<string, string>,
  hi: hi as Record<string, string>,
  kn: kn as Record<string, string>,
  ml: ml as Record<string, string>,
  mr: mr as Record<string, string>,
  ne: ne as Record<string, string>,
  or: orLocale as Record<string, string>,
  pa: pa as Record<string, string>,
  sa: sa as Record<string, string>,
  ta: ta as Record<string, string>,
  te: te as Record<string, string>,
  ur: ur as Record<string, string>,
};

interface I18nContextType {
  selectedLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageConfig[];
  currentLanguage: LanguageConfig;
  isRTL: boolean;
}

const STORAGE_KEY = "hh_voice_rag_lang";

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguageState] = useState<string>("en");

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TRANSLATION_MAP[saved]) {
        setSelectedLanguageState(saved);
        updateDocumentAttributes(saved);
      }
    } catch (_) {}
  }, []);

  const updateDocumentAttributes = (lang: string) => {
    if (typeof document === "undefined") return;
    const isUrdu = lang === "ur";
    document.documentElement.dir = isUrdu ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const setLanguage = (lang: string) => {
    const validLang = TRANSLATION_MAP[lang] ? lang : "en";
    setSelectedLanguageState(validLang);
    updateDocumentAttributes(validLang);
    try {
      localStorage.setItem(STORAGE_KEY, validLang);
    } catch (_) {}
  };

  const currentLanguage = useMemo(() => {
    return LANGUAGES[selectedLanguage] || LANGUAGES.en;
  }, [selectedLanguage]);

  const isRTL = Boolean(currentLanguage.isRTL);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const localeDict = TRANSLATION_MAP[selectedLanguage] || TRANSLATION_MAP.en;
    // Target translation -> English fallback -> Key
    let text = localeDict[key] || TRANSLATION_MAP.en[key] || key;

    // Handle variable interpolation for {var} and {{var}}
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, "g"), String(v));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider
      value={{
        selectedLanguage,
        setLanguage,
        t,
        languages: LANGUAGE_LIST,
        currentLanguage,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}

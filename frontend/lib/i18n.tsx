"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import enTranslations from "@/locales/en.json";
import hiTranslations from "@/locales/hi.json";

export interface LocaleOption {
  code: string;
  name: string;
  nativeName: string;
  sttCode: string;
  ttsLang: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", name: "English", nativeName: "English", sttCode: "en", ttsLang: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", sttCode: "hi", ttsLang: "hi-IN" },
];

const TRANSLATION_MAP: Record<string, Record<string, string>> = {
  en: enTranslations as Record<string, string>,
  hi: hiTranslations as Record<string, string>,
};

interface I18nContextType {
  selectedLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locales: LocaleOption[];
  currentLocale: LocaleOption;
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
      }
    } catch (_) {}
  }, []);

  const setLanguage = (lang: string) => {
    const validLang = TRANSLATION_MAP[lang] ? lang : "en";
    setSelectedLanguageState(validLang);
    try {
      localStorage.setItem(STORAGE_KEY, validLang);
      document.documentElement.lang = validLang;
    } catch (_) {}
  };

  const currentLocale = useMemo(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === selectedLanguage) || SUPPORTED_LOCALES[0];
  }, [selectedLanguage]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const localeDict = TRANSLATION_MAP[selectedLanguage] || TRANSLATION_MAP.en;
    let text = localeDict[key] || TRANSLATION_MAP.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
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
        locales: SUPPORTED_LOCALES,
        currentLocale,
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

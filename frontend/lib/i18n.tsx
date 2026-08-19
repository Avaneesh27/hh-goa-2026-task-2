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
  // Page UI Language (Controlled only in Settings -> Page Language)
  pageLanguage: string;
  setPageLanguage: (lang: string) => void;
  currentPageLanguage: LanguageConfig;

  // Voice Interaction Language (Controlled in Navbar & Try Example Chips)
  interactionLanguage: string;
  setInteractionLanguage: (lang: string) => void;
  currentInteractionLanguage: LanguageConfig;

  // Optional Sync Toggle
  syncVoiceWithPage: boolean;
  setSyncVoiceWithPage: (sync: boolean) => void;

  // Translation helpers
  t: (key: string, params?: Record<string, string | number>) => string;
  tInteraction: (key: string, params?: Record<string, string | number>) => string;

  // Metadata
  languages: LanguageConfig[];
  isRTL: boolean;
  isInteractionRTL: boolean;

  // Backwards compatibility alias for components expecting selectedLanguage
  selectedLanguage: string;
  setLanguage: (lang: string) => void;
  currentLanguage: LanguageConfig;
}

const PAGE_LANG_STORAGE_KEY = "hhgoa_page_language";
const INTERACTION_LANG_STORAGE_KEY = "hhgoa_interaction_language";
const SYNC_VOICE_STORAGE_KEY = "hhgoa_sync_voice";

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageLanguage, setPageLanguageState] = useState<string>("en");
  const [interactionLanguage, setInteractionLanguageState] = useState<string>("en");
  const [syncVoiceWithPage, setSyncVoiceWithPageState] = useState<boolean>(false);

  // Load persisted states from localStorage on client mount
  useEffect(() => {
    try {
      const savedPageLang = localStorage.getItem(PAGE_LANG_STORAGE_KEY);
      if (savedPageLang && TRANSLATION_MAP[savedPageLang]) {
        setPageLanguageState(savedPageLang);
        updateDocumentAttributes(savedPageLang);
      }

      const savedInteractionLang = localStorage.getItem(INTERACTION_LANG_STORAGE_KEY);
      if (savedInteractionLang && TRANSLATION_MAP[savedInteractionLang]) {
        setInteractionLanguageState(savedInteractionLang);
      }

      const savedSync = localStorage.getItem(SYNC_VOICE_STORAGE_KEY);
      if (savedSync !== null) {
        setSyncVoiceWithPageState(savedSync === "true");
      }
    } catch (_) {}
  }, []);

  const updateDocumentAttributes = (lang: string) => {
    if (typeof document === "undefined") return;
    const isUrdu = lang === "ur";
    document.documentElement.dir = isUrdu ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  // Set Page Language (Only called explicitly from Settings)
  const setPageLanguage = (lang: string) => {
    const validLang = TRANSLATION_MAP[lang] ? lang : "en";
    setPageLanguageState(validLang);
    updateDocumentAttributes(validLang);
    try {
      localStorage.setItem(PAGE_LANG_STORAGE_KEY, validLang);
    } catch (_) {}

    // If sync is explicitly enabled by the user in settings, also update interaction language
    if (syncVoiceWithPage) {
      setInteractionLanguageState(validLang);
      try {
        localStorage.setItem(INTERACTION_LANG_STORAGE_KEY, validLang);
      } catch (_) {}
    }
  };

  // Set Interaction Language (Called from Navbar Voice selector or Try chips)
  const setInteractionLanguage = (lang: string) => {
    const validLang = TRANSLATION_MAP[lang] ? lang : "en";
    setInteractionLanguageState(validLang);
    try {
      localStorage.setItem(INTERACTION_LANG_STORAGE_KEY, validLang);
    } catch (_) {}
  };

  // Toggle Sync Setting
  const setSyncVoiceWithPage = (sync: boolean) => {
    setSyncVoiceWithPageState(sync);
    try {
      localStorage.setItem(SYNC_VOICE_STORAGE_KEY, String(sync));
    } catch (_) {}
    if (sync) {
      setInteractionLanguage(pageLanguage);
    }
  };

  const currentPageLanguage = useMemo(() => {
    return LANGUAGES[pageLanguage] || LANGUAGES.en;
  }, [pageLanguage]);

  const currentInteractionLanguage = useMemo(() => {
    return LANGUAGES[interactionLanguage] || LANGUAGES.en;
  }, [interactionLanguage]);

  const isRTL = Boolean(currentPageLanguage.isRTL);
  const isInteractionRTL = Boolean(currentInteractionLanguage.isRTL);

  // Translate static UI elements according to pageLanguage
  const t = (key: string, params?: Record<string, string | number>): string => {
    const localeDict = TRANSLATION_MAP[pageLanguage] || TRANSLATION_MAP.en;
    let text = localeDict[key] || TRANSLATION_MAP.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, "g"), String(v));
      });
    }

    return text;
  };

  // Translate interaction elements according to interactionLanguage
  const tInteraction = (key: string, params?: Record<string, string | number>): string => {
    const localeDict = TRANSLATION_MAP[interactionLanguage] || TRANSLATION_MAP.en;
    let text = localeDict[key] || TRANSLATION_MAP.en[key] || key;

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
        pageLanguage,
        setPageLanguage,
        currentPageLanguage,
        interactionLanguage,
        setInteractionLanguage,
        currentInteractionLanguage,
        syncVoiceWithPage,
        setSyncVoiceWithPage,
        t,
        tInteraction,
        languages: LANGUAGE_LIST,
        isRTL,
        isInteractionRTL,
        // Compatibility aliases mapped to interaction language for Voice RAG
        selectedLanguage: interactionLanguage,
        setLanguage: setInteractionLanguage,
        currentLanguage: currentInteractionLanguage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
};

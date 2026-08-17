/**
 * Centralized Language Configuration for all 15 supported languages.
 * Single source of truth for UI, STT, RAG, and TTS language parameters.
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  googleCode: string;
  sttCode: string;
  ttsCode: string;
  isRTL?: boolean;
  sampleQuery?: string;
}

export const LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    googleCode: "en",
    sttCode: "en-IN",
    ttsCode: "en-IN",
    isRTL: false,
    sampleQuery: "What is a corporation?",
  },
  as: {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    googleCode: "as",
    sttCode: "as-IN",
    ttsCode: "as-IN",
    isRTL: false,
    sampleQuery: "কৰ্পৰেচন কি?",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    googleCode: "bn",
    sttCode: "bn-IN",
    ttsCode: "bn-IN",
    isRTL: false,
    sampleQuery: "কর্পোরেশন কি?",
  },
  gu: {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    googleCode: "gu",
    sttCode: "gu-IN",
    ttsCode: "gu-IN",
    isRTL: false,
    sampleQuery: "કોર્પોરેશન શું છે?",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    googleCode: "hi",
    sttCode: "hi-IN",
    ttsCode: "hi-IN",
    isRTL: false,
    sampleQuery: "कॉर्पोरेशन क्या है?",
  },
  kn: {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    googleCode: "kn",
    sttCode: "kn-IN",
    ttsCode: "kn-IN",
    isRTL: false,
    sampleQuery: "ಕಾರ್ಪೊರೇಷನ್ ಎಂದರೇನು?",
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    googleCode: "ml",
    sttCode: "ml-IN",
    ttsCode: "ml-IN",
    isRTL: false,
    sampleQuery: "കോർപ്പറേഷൻ എന്നാൽ എന്താണ്?",
  },
  mr: {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    googleCode: "mr",
    sttCode: "mr-IN",
    ttsCode: "mr-IN",
    isRTL: false,
    sampleQuery: "कॉर्पोरेशन म्हणजे काय?",
  },
  ne: {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    googleCode: "ne",
    sttCode: "ne-NP",
    ttsCode: "ne-NP",
    isRTL: false,
    sampleQuery: "निगम भनेको के हो?",
  },
  or: {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    googleCode: "or",
    sttCode: "or-IN",
    ttsCode: "or-IN",
    isRTL: false,
    sampleQuery: "କର୍ପୋରେସନ୍ କ’ଣ?",
  },
  pa: {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    googleCode: "pa",
    sttCode: "pa-IN",
    ttsCode: "pa-IN",
    isRTL: false,
    sampleQuery: "ਕਾਰਪੋਰੇਸ਼ਨ ਕੀ ਹੈ?",
  },
  sa: {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    googleCode: "sa",
    sttCode: "sa-IN",
    ttsCode: "sa-IN",
    isRTL: false,
    sampleQuery: "निगमः किम्?",
  },
  ta: {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    googleCode: "ta",
    sttCode: "ta-IN",
    ttsCode: "ta-IN",
    isRTL: false,
    sampleQuery: "கார்ப்பரேஷன் என்றால் என்ன?",
  },
  te: {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    googleCode: "te",
    sttCode: "te-IN",
    ttsCode: "te-IN",
    isRTL: false,
    sampleQuery: "కార్పొరేషన్ అంటే ఏమిటి?",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    googleCode: "ur",
    sttCode: "ur-IN",
    ttsCode: "ur-IN",
    isRTL: true,
    sampleQuery: "کارپوریشن کیا ہے؟",
  },
};

export const LANGUAGE_LIST = Object.values(LANGUAGES);

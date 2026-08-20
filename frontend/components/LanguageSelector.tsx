import React from "react";
import { Globe } from "lucide-react";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "", name: "Auto-Detect", nativeName: "Auto" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "hinglish", name: "Hinglish", nativeName: "Hinglish" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2 bg-[#FFFFFF] dark:bg-[#161F30] border border-[#EBE5D8] dark:border-[#232E42] rounded-lg px-3 py-1.5 shadow-sm text-xs">
      <Globe className="w-3.5 h-3.5 text-[#E85D42] shrink-0" />
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent text-xs text-[#172033] dark:text-[#F8FAFC] font-medium focus:outline-none cursor-pointer pr-1"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-[#FFFFFF] dark:bg-[#161F30] text-[#172033] dark:text-[#F8FAFC] py-1"
          >
            {lang.name} {lang.code ? `(${lang.nativeName})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

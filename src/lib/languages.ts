import type { LanguageCode } from "../../shared/types.js";

export const LANGUAGES: Record<LanguageCode, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  ar: { label: "العربية", flag: "🇸🇦" },
  ur: { label: "اردو", flag: "🇵🇰" },
};

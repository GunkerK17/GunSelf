"use client";

import { languageLabels, Language } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";

type LanguageSwitchProps = {
  className?: string;
  variant?: "light" | "dark";
};

export function LanguageSwitch({ className = "", variant = "light" }: LanguageSwitchProps) {
  const { language, setLanguage } = useLanguage();
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex rounded-xl border p-1 ${
        isDark ? "border-slate-700 bg-slate-900/85" : "border-slate-300 bg-white/90"
      } ${className}`}
    >
      {(Object.keys(languageLabels) as Language[]).map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-gradient-to-r from-[#d63b3b] to-[#861c1c] text-white"
                : isDark
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setLanguage(lang)}
            type="button"
          >
            {languageLabels[lang]}
          </button>
        );
      })}
    </div>
  );
}

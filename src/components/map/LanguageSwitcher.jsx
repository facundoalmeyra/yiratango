import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useI18n } from '@/components/contexts/I18nContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: 'en', flagUrl: 'https://flagcdn.com/w40/us.png', label: 'English' },
  { code: 'es', flagUrl: 'https://flagcdn.com/w40/es.png', label: 'Español' },
];

export default function LanguageSwitcher({ variant = 'dark' }) {
  const { lang, changeLang } = useI18n();
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center justify-center h-8 gap-1.5 px-2.5 rounded-full backdrop-blur-xl border text-sm transition-colors ${variant === 'light' ? 'bg-white text-black border-black/10 hover:bg-gray-50 shadow-sm' : 'bg-black/40 text-white border-white/10 hover:bg-black/60'}`}>
          <img src={current.flagUrl} alt={current.label} className="w-4 h-auto rounded-[2px]" />
          <ChevronDown className={`w-3 h-3 ${variant === 'light' ? 'text-black/60' : 'text-white/60'}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`${variant === 'light' ? 'bg-white text-black border-black/10' : 'bg-[#222222] text-white border-white/10'} rounded-xl shadow-2xl p-2 min-w-[130px] z-[60]`}>
        {LANGUAGES.map(({ code, flagUrl, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => code !== lang && changeLang(code)}
            className={`flex items-center gap-2.5 cursor-pointer ${variant === 'light' ? 'focus:bg-black/5 focus:text-black' : 'focus:bg-white/10 focus:text-white'} ${code === lang ? 'opacity-50 cursor-default pointer-events-none' : ''}`}
          >
            <img src={flagUrl} alt={label} className="w-5 h-auto rounded-[2px]" />
            <span className="text-sm">{label}</span>
            {code === lang && <Check className={`w-3.5 h-3.5 ml-auto ${variant === 'light' ? 'text-black/60' : 'text-white/60'}`} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
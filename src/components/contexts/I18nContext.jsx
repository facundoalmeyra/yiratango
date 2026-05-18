import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/components/utils/translations';
import { useLocation, useNavigate } from 'react-router-dom';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [lang, setLang] = useState(() => {
    const path = location.pathname;
    const match = path.match(/^\/(en|es)(\/|$)/);
    if (match) {
      localStorage.setItem('yira_lang', match[1]);
      return match[1];
    }
    const savedLang = localStorage.getItem('yira_lang');
    if (savedLang) return savedLang;
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.toLowerCase().startsWith('es') ? 'es' : 'en';
  });

  useEffect(() => {
    const path = location.pathname;
    const match = path.match(/^\/(en|es)(\/|$)/);
    
    if (!match) {
      const newPath = `/${lang}${path === '/' ? '' : path}`;
      navigate(newPath + location.search + location.hash, { replace: true });
    } else if (match[1] !== lang) {
      setLang(match[1]);
      localStorage.setItem('yira_lang', match[1]);
    }
  }, [location.pathname, lang, navigate]);

  const changeLang = (newLang) => {
    localStorage.setItem('yira_lang', newLang);
    const path = location.pathname;
    const match = path.match(/^\/(en|es)(\/|$)/);
    let newPath;
    if (match) {
      newPath = path.replace(/^\/(en|es)/, `/${newLang}`);
    } else {
      newPath = `/${newLang}${path === '/' ? '' : path}`;
    }
    navigate(newPath + location.search + location.hash, { replace: true });
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
import React, { createContext, useContext, useState } from 'react';
import { Lang, setLang as setI18nLang, getLang } from '@/lib/i18n';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextType>({
  lang: 'bn',
  setLang: () => {},
});

export const useLang = () => useContext(LangContext);

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(getLang());

  const setLang = (l: Lang) => {
    setI18nLang(l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};

import { useState, useEffect } from 'react';
import translationService from '../services/translationService';

export const useTranslation = () => {
  const [language, setLanguage] = useState(translationService.getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const t = (key, params = {}) => {
    return translationService.t(key, params);
  };

  const changeLanguage = (newLanguage) => {
    translationService.setLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const getAvailableLanguages = () => {
    return translationService.getAvailableLanguages();
  };

  return {
    t,
    language,
    changeLanguage,
    getAvailableLanguages
  };
};

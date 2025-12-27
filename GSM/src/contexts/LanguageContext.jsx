import React, { createContext, useContext, useState, useEffect } from 'react';
import translationService from '../services/translationService';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(translationService.getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(storedLanguage);
    translationService.setLanguage(storedLanguage);
  }, []);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = async (newLanguage) => {
    setIsLoading(true);
    try {
      // Update the translation service
      translationService.setLanguage(newLanguage);
      
      // Update state
      setLanguage(newLanguage);
      
      // Store in localStorage
      localStorage.setItem('language', newLanguage);
      
      // Update document language attribute
      document.documentElement.lang = newLanguage;
      
      // Dispatch global language change event
      window.dispatchEvent(new CustomEvent('globalLanguageChanged', { 
        detail: { language: newLanguage } 
      }));
      
      console.log(`Global language changed to: ${newLanguage}`);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key, params = {}) => {
    return translationService.t(key, params);
  };

  const getAvailableLanguages = () => {
    return translationService.getAvailableLanguages();
  };

  const value = {
    language,
    changeLanguage,
    t,
    getAvailableLanguages,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

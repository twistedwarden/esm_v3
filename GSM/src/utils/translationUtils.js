import { useLanguage } from '../contexts/LanguageContext';

// Utility function to get translation function
export const useTranslation = () => {
  return useLanguage();
};

// Utility function to translate text outside of React components
export const translateText = (key, params = {}) => {
  // This can be used in non-React contexts
  const translationService = require('../services/translationService').default;
  return translationService.t(key, params);
};

// Utility function to get current language
export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'en';
};

// Utility function to change language programmatically
export const changeLanguage = (language) => {
  const translationService = require('../services/translationService').default;
  translationService.setLanguage(language);
};

// Utility function to check if translation exists
export const hasTranslation = (key) => {
  const translationService = require('../services/translationService').default;
  return translationService.hasTranslation(key);
};

// Utility function to get all available languages
export const getAvailableLanguages = () => {
  const translationService = require('../services/translationService').default;
  return translationService.getAvailableLanguages();
};

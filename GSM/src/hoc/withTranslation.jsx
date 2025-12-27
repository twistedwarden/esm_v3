import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Higher-Order Component for automatic translation
export const withTranslation = (WrappedComponent) => {
  return function TranslatedComponent(props) {
    const { t, language, changeLanguage, isLoading } = useLanguage();
    
    return (
      <WrappedComponent
        {...props}
        t={t}
        language={language}
        changeLanguage={changeLanguage}
        isLoading={isLoading}
      />
    );
  };
};

// Hook for easy translation access
export const useGlobalTranslation = () => {
  return useLanguage();
};

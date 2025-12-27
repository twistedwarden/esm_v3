import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Example component showing how to use global translations
const GlobalLanguageExample = () => {
  const { t, language, changeLanguage } = useLanguage();

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">{t('Dashboard')}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('Language')}</label>
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="en">{t('English')}</option>
            <option value="fil">{t('Filipino')}</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            {t('Save')}
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            {t('Cancel')}
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>{t('Current language')}: <strong>{language}</strong></p>
          <p>{t('This component automatically translates when language changes')}</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLanguageExample;
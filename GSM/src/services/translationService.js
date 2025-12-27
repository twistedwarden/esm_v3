import { globalTranslations } from '../translations/globalTranslations';

// Fallback translations in case import fails
const fallbackTranslations = {
  en: {
    'Dashboard': 'Dashboard',
    'Settings': 'Settings',
    'Profile': 'Profile',
    'Logout': 'Logout',
    'SSC Management': 'SSC Management',
    'School Aid Distribution': 'School Aid Distribution',
    'Student Registry': 'Student Registry',
    'Overview': 'Overview',
    'Active Students': 'Active Students',
    'Archived Students': 'Archived Students',
    'Scholars': 'Scholars',
    'Bulk Operations': 'Bulk Operations',
    'Reports & Analytics': 'Reports & Analytics',
    'Import/Export': 'Import/Export',
    'Partner School Database': 'Partner School Database',
    'School Management': 'School Management',
    'Student Population': 'Student Population',
    'Verification & Accreditation': 'Verification & Accreditation',
    'Analytics & Reports': 'Analytics & Reports',
    'Education Monitoring': 'Education Monitoring',
    'Academic Performance': 'Academic Performance',
    'Enrollment Statistics': 'Enrollment Statistics',
    'Student Progress': 'Student Progress',
    'Analytics': 'Analytics',
    'User Management': 'User Management',
    'Audit Logs': 'Audit Logs',
    'Security': 'Security',
    'Document Security': 'Document Security',
    'Threat Monitoring': 'Threat Monitoring',
    'Quarantine': 'Quarantine',
    'Security Settings': 'Security Settings',
    'Archived Data': 'Archived Data',
    'Applications': 'Applications',
    'Programs': 'Programs',
    'Scholarship': 'Scholarship'
  },
  fil: {
    'Dashboard': 'Dashboard',
    'Settings': 'Mga Setting',
    'Profile': 'Profil',
    'Logout': 'Mag-logout',
    'SSC Management': 'Pamahalaan ng SSC',
    'School Aid Distribution': 'Pamamahagi ng Tulong sa Paaralan',
    'Student Registry': 'Registry ng Estudyante',
    'Overview': 'Pangkalahatang Tingin',
    'Active Students': 'Aktibong Estudyante',
    'Archived Students': 'Na-archive na Estudyante',
    'Scholars': 'Mga Scholar',
    'Bulk Operations': 'Mga Bulk na Operasyon',
    'Reports & Analytics': 'Mga Ulat at Analytics',
    'Import/Export': 'Import/Export',
    'Partner School Database': 'Database ng Partner School',
    'School Management': 'Pamahalaan ng Paaralan',
    'Student Population': 'Populasyon ng Estudyante',
    'Verification & Accreditation': 'Verification at Accreditation',
    'Analytics & Reports': 'Analytics at Ulat',
    'Education Monitoring': 'Monitoring ng Edukasyon',
    'Academic Performance': 'Performance sa Akademiko',
    'Enrollment Statistics': 'Mga Estadistika ng Enrollment',
    'Student Progress': 'Progreso ng Estudyante',
    'Analytics': 'Analytics',
    'User Management': 'Pamahalaan ng User',
    'Audit Logs': 'Mga Log ng Audit',
    'Security': 'Seguridad',
    'Document Security': 'Seguridad ng Dokumento',
    'Threat Monitoring': 'Monitoring ng Banta',
    'Quarantine': 'Quarantine',
    'Security Settings': 'Mga Setting ng Seguridad',
    'Archived Data': 'Na-archive na Data',
    'Applications': 'Mga Application',
    'Programs': 'Mga Programa',
    'Scholarship': 'Scholarship'
  }
};

// Translation Service
class TranslationService {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.translations = globalTranslations || fallbackTranslations;
    this.listeners = [];
    
    // Debug logging
    console.log('TranslationService initialized:', {
      currentLanguage: this.currentLanguage,
      hasTranslations: !!this.translations,
      translationKeys: this.translations ? Object.keys(this.translations) : []
    });
  }

  // Get translation for a key
  t(key, params = {}) {
    try {
      // Ensure translations are loaded
      this.ensureTranslationsLoaded();
      
      // Ensure translations object exists
      if (!this.translations || !this.translations[this.currentLanguage]) {
        console.warn('Translations not loaded, using key as fallback:', key);
        return key;
      }
      
      const translation = this.translations[this.currentLanguage][key] || key;
      
      // Replace parameters in translation
      if (typeof translation === 'string') {
        return translation.replace(/\{(\w+)\}/g, (match, param) => {
          return params[param] || match;
        });
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error, 'Key:', key);
      return key;
    }
  }

  // Set current language
  setLanguage(language) {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(language));
    
    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get available languages
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fil', name: 'Filipino', nativeName: 'Filipino' }
    ];
  }

  // Check if translation exists
  hasTranslation(key) {
    this.ensureTranslationsLoaded();
    return this.translations[this.currentLanguage]?.hasOwnProperty(key) || false;
  }

  // Get all translations for current language
  getAllTranslations() {
    this.ensureTranslationsLoaded();
    return this.translations[this.currentLanguage] || {};
  }

  // Get translation service status
  getStatus() {
    return {
      currentLanguage: this.currentLanguage,
      hasTranslations: !!this.translations,
      translationCount: this.translations ? Object.keys(this.translations).length : 0,
      currentLanguageTranslations: this.translations?.[this.currentLanguage] ? Object.keys(this.translations[this.currentLanguage]).length : 0,
      isUsingFallback: this.translations === fallbackTranslations
    };
  }

  // Ensure translations are loaded
  ensureTranslationsLoaded() {
    if (!this.translations || Object.keys(this.translations).length === 0) {
      console.warn('Translations not loaded, attempting to reload...');
      this.translations = globalTranslations || fallbackTranslations;
    }
  }

  // Reload translations (useful for development)
  reloadTranslations() {
    try {
      // Try to re-import the translations
      import('../translations/globalTranslations').then(({ globalTranslations: newTranslations }) => {
        this.translations = newTranslations || fallbackTranslations;
        console.log('Translations reloaded successfully');
      }).catch(() => {
        this.translations = fallbackTranslations;
        console.log('Using fallback translations');
      });
    } catch (error) {
      console.error('Error reloading translations:', error);
      this.translations = fallbackTranslations;
    }
  }

  // Subscribe to language changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Change language (alias for setLanguage for compatibility)
  changeLanguage(language) {
    this.setLanguage(language);
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;

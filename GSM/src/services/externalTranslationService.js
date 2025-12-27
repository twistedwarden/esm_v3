// External Translation Service (Optional)
// This can be used to integrate with external translation APIs like Google Translate, Microsoft Translator, etc.

class ExternalTranslationService {
  constructor() {
    this.apiKey = process.env.REACT_APP_TRANSLATION_API_KEY || '';
    this.baseUrl = 'https://api.mymemory.translated.net'; // Free translation API
  }

  // Translate text using external API
  async translateText(text, fromLang = 'en', toLang = 'fil') {
    try {
      if (!text || text.trim() === '') return text;

      // Use MyMemory API (free, no API key required)
      const response = await fetch(
        `${this.baseUrl}/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        return data.responseData.translatedText;
      } else {
        console.warn('Translation API returned no result, using fallback');
        return text; // Return original text if translation fails
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // Batch translate multiple texts
  async translateBatch(texts, fromLang = 'en', toLang = 'fil') {
    try {
      const translations = await Promise.all(
        texts.map(text => this.translateText(text, fromLang, toLang))
      );
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    }
  }

  // Check if external translation is available
  isAvailable() {
    return true; // MyMemory API doesn't require API key
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'fil', name: 'Filipino' },
      { code: 'tl', name: 'Tagalog' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' }
    ];
  }
}

// Create singleton instance
const externalTranslationService = new ExternalTranslationService();

export default externalTranslationService;

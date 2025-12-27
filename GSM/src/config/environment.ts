// Environment Configuration for GoServePH GSM
// This file handles environment variables and configuration

interface ConfigData {
  brevoApiKey: string;
  googleClientId: string;
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  debugMode: boolean;
  showOtpInDev: boolean;
}

class EnvironmentConfig {
  private config: ConfigData;

  constructor() {
    this.config = {
      brevoApiKey: import.meta.env.VITE_BREVO_API_KEY || '',
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
      appName: import.meta.env.VITE_APP_NAME || 'GoServePH',
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      showOtpInDev: import.meta.env.VITE_SHOW_OTP_IN_DEV === 'true'
    };
  }

  get brevoApiKey(): string {
    return this.config.brevoApiKey;
  }

  get googleClientId(): string {
    return this.config.googleClientId;
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  get appName(): string {
    return this.config.appName;
  }

  get appVersion(): string {
    return this.config.appVersion;
  }

  get debugMode(): boolean {
    return this.config.debugMode;
  }

  get showOtpInDev(): boolean {
    return this.config.showOtpInDev;
  }

  /**
   * Check if all required environment variables are set
   */
  validateConfiguration(): { isValid: boolean; missingVars: string[] } {
    const missingVars: string[] = [];

    if (!this.config.brevoApiKey) {
      missingVars.push('VITE_BREVO_API_KEY');
    }

    if (!this.config.googleClientId) {
      missingVars.push('VITE_GOOGLE_CLIENT_ID');
    }

    return {
      isValid: missingVars.length === 0,
      missingVars
    };
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): Record<string, any> {
    return {
      appName: this.config.appName,
      appVersion: this.config.appVersion,
      apiBaseUrl: this.config.apiBaseUrl,
      debugMode: this.config.debugMode,
      showOtpInDev: this.config.showOtpInDev,
      hasBrevoApiKey: !!this.config.brevoApiKey,
      hasGoogleClientId: !!this.config.googleClientId,
      brevoApiKeyLength: this.config.brevoApiKey.length,
      googleClientIdLength: this.config.googleClientId.length
    };
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfig();

export default EnvironmentConfig;

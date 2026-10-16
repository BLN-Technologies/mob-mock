/**
 * Cargo Mobile V1 - Centralized Environment Configuration
 * Enforces explicit boundaries between simulated/demo mode and production backend services.
 * Follows the 12-factor configuration pattern via Expo public environment variables.
 */

export type AppEnvironment = 'demo' | 'staging' | 'production';

export interface AppConfig {
  env: AppEnvironment;
  apiUrl: string;
  isDemo: boolean;
  isProduction: boolean;
  version: string;
  buildNumber: string;
  supportEmail: string;
  supportPhone: string;
}

declare const process: any;

const currentEnv = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APP_ENV) || 'demo';
const apiUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'https://api.cargo.rw/v1';

export const config: AppConfig = {
  env: (currentEnv === 'production' || currentEnv === 'staging' ? currentEnv : 'demo') as AppEnvironment,
  apiUrl,
  isDemo: currentEnv !== 'production',
  isProduction: currentEnv === 'production',
  version: '1.0.0',
  buildNumber: '2026.10.1',
  supportEmail: 'operations@cargo.rw',
  supportPhone: '+250788123456',
};

/**
 * Checks whether the current build is configured as a standalone demo/mock client.
 */
export function isDemoEnvironment(): boolean {
  return config.isDemo;
}

/**
 * Ensures production operations do not silently execute against mock services.
 */
export function assertProductionBackendConfigured(): void {
  if (config.isProduction && (!config.apiUrl || config.apiUrl.includes('mock'))) {
    throw new Error(
      'Release Safety Violation: Production mode requires a live, secure NestJS backend endpoint (EXPO_PUBLIC_API_URL).'
    );
  }
}

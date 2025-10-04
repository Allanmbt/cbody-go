import Constants from 'expo-constants';

function getEnvVar(key: string): string {
  // Try to get from expo config extra, then from process.env
  const value =
    Constants.expoConfig?.extra?.[key] ??
    process.env[key];

  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    console.log('Available env keys:', Object.keys(process.env || {}));
    console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
    throw new Error(`Missing environment variable: ${key}. Please check your .env file.`);
  }

  return value;
}

export const ENV = {
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
} as const;

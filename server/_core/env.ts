/**
 * Validates that a secret meets minimum security requirements
 */
function validateSecret(value: string | undefined, name: string, minLength: number = 32): string {
  if (!value) {
    throw new Error(
      `${name} must be set in environment variables.\n` +
      `Generate a secure secret with: openssl rand -base64 48`
    );
  }
  
  if (value.length < minLength) {
    throw new Error(
      `${name} must be at least ${minLength} characters (currently ${value.length}).\n` +
      `Generate a secure secret with: openssl rand -base64 48`
    );
  }
  
  return value;
}

/**
 * Validates environment variables with security checks
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: validateSecret(process.env.JWT_SECRET, "JWT_SECRET", 32),
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};

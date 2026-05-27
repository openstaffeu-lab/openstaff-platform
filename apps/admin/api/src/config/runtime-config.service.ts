import { Injectable, Logger } from '@nestjs/common';

export type RuntimeFeatureFlags = {
  DEMO_MODE: boolean;
  ENABLE_DEV_AUTH_BYPASS: boolean;
  ENABLE_AI_FALLBACK: boolean;
  ENABLE_DEMO_PUBLIC_FEED: boolean;
  ENABLE_DEMO_MESSAGING: boolean;
  ENABLE_BILLING_PLACEHOLDERS: boolean;
  ENABLE_WEBHOOK_PLACEHOLDER: boolean;
  ENABLE_SMS_PLACEHOLDER: boolean;
  ENABLE_DEBUG_LOGS: boolean;
};

export type RuntimeValidationSummary = {
  environment: string;
  warnings: string[];
  errors: string[];
};

function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function normalizeNodeEnv(value: string | undefined) {
  if (value === 'production' || value === 'test') {
    return value;
  }

  return 'development';
}

function buildRuntimeFeatureFlags(env: NodeJS.ProcessEnv): RuntimeFeatureFlags {
  const nodeEnv = normalizeNodeEnv(env.NODE_ENV);
  const isProduction = nodeEnv === 'production';

  return {
    DEMO_MODE: parseBooleanFlag(env.DEMO_MODE, false),
    ENABLE_DEV_AUTH_BYPASS: parseBooleanFlag(env.ENABLE_DEV_AUTH_BYPASS, false),
    ENABLE_AI_FALLBACK: parseBooleanFlag(env.ENABLE_AI_FALLBACK, !isProduction),
    ENABLE_DEMO_PUBLIC_FEED: parseBooleanFlag(
      env.ENABLE_DEMO_PUBLIC_FEED,
      false,
    ),
    ENABLE_DEMO_MESSAGING: parseBooleanFlag(env.ENABLE_DEMO_MESSAGING, false),
    ENABLE_BILLING_PLACEHOLDERS: parseBooleanFlag(
      env.ENABLE_BILLING_PLACEHOLDERS,
      !isProduction,
    ),
    ENABLE_WEBHOOK_PLACEHOLDER: parseBooleanFlag(
      env.ENABLE_WEBHOOK_PLACEHOLDER,
      !isProduction,
    ),
    ENABLE_SMS_PLACEHOLDER: parseBooleanFlag(
      env.ENABLE_SMS_PLACEHOLDER,
      !isProduction,
    ),
    ENABLE_DEBUG_LOGS: parseBooleanFlag(env.ENABLE_DEBUG_LOGS, !isProduction),
  };
}

export function validateRuntimeEnvironment(
  env: NodeJS.ProcessEnv,
): RuntimeValidationSummary {
  const environment = normalizeNodeEnv(env.NODE_ENV);
  const isProduction = environment === 'production';
  const flags = buildRuntimeFeatureFlags(env);
  const warnings: string[] = [];
  const errors: string[] = [];

  const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const variableName of criticalVars) {
    if (!env[variableName]?.trim()) {
      if (isProduction) {
        errors.push(`${variableName} is required in production.`);
      } else {
        warnings.push(`${variableName} is not configured.`);
      }
    }
  }

  if (!env.NODE_ENV?.trim()) {
    warnings.push('NODE_ENV is not set explicitly; defaulting to development.');
  }

  const corsConfigured =
    Boolean(env.CORS_ORIGIN?.trim()) ||
    Boolean(env.FRONTEND_URL?.trim()) ||
    Boolean(env.ADMIN_URL?.trim()) ||
    Boolean(env.NEXT_PUBLIC_API_URL?.trim());

  if (!corsConfigured) {
    if (isProduction) {
      errors.push(
        'At least one frontend/CORS origin must be configured via CORS_ORIGIN, FRONTEND_URL, or ADMIN_URL in production.',
      );
    } else {
      warnings.push('No explicit frontend/CORS origin env vars were provided.');
    }
  }

  if (
    isProduction &&
    (env.SKIP_FIREBASE_AUTH === 'true' || env.SKIP_JWT_AUTH === 'true')
  ) {
    errors.push('Auth bypass env flags are not allowed in production.');
  }

  if (isProduction && flags.ENABLE_DEV_AUTH_BYPASS) {
    errors.push('ENABLE_DEV_AUTH_BYPASS must be disabled in production.');
  }

  if (isProduction && flags.DEMO_MODE) {
    errors.push('DEMO_MODE must be disabled in production.');
  }

  if (isProduction && flags.ENABLE_DEMO_PUBLIC_FEED) {
    errors.push('ENABLE_DEMO_PUBLIC_FEED must be disabled in production.');
  }

  if (isProduction && flags.ENABLE_DEMO_MESSAGING) {
    errors.push('ENABLE_DEMO_MESSAGING must be disabled in production.');
  }

  if (!env.GEMINI_API_KEY?.trim()) {
    if (flags.ENABLE_AI_FALLBACK) {
      warnings.push(
        'GEMINI_API_KEY is missing; AI requests will rely on explicit fallback behavior.',
      );
    } else {
      warnings.push(
        'GEMINI_API_KEY is missing; AI features may be unavailable.',
      );
    }
  }

  return {
    environment,
    warnings,
    errors,
  };
}

export function assertRuntimeEnvironment(env: NodeJS.ProcessEnv) {
  const summary = validateRuntimeEnvironment(env);

  if (summary.errors.length > 0) {
    throw new Error(
      `Runtime environment validation failed: ${summary.errors.join(' | ')}`,
    );
  }

  return summary;
}

@Injectable()
export class RuntimeConfigService {
  private readonly logger = new Logger(RuntimeConfigService.name);

  get environment() {
    return normalizeNodeEnv(process.env.NODE_ENV);
  }

  get isProduction() {
    return this.environment === 'production';
  }

  get isDevelopment() {
    return !this.isProduction;
  }

  getFeatureFlags(): RuntimeFeatureFlags {
    return buildRuntimeFeatureFlags(process.env);
  }

  getValidationSummary() {
    return validateRuntimeEnvironment(process.env);
  }

  isDemoModeEnabled() {
    return this.getFeatureFlags().DEMO_MODE;
  }

  isDevAuthBypassEnabled() {
    return this.isDevelopment && this.getFeatureFlags().ENABLE_DEV_AUTH_BYPASS;
  }

  isAiFallbackEnabled() {
    return this.getFeatureFlags().ENABLE_AI_FALLBACK;
  }

  isDemoPublicFeedEnabled() {
    return this.getFeatureFlags().ENABLE_DEMO_PUBLIC_FEED;
  }

  isDemoMessagingEnabled() {
    return this.getFeatureFlags().ENABLE_DEMO_MESSAGING;
  }

  isBillingPlaceholdersEnabled() {
    return this.getFeatureFlags().ENABLE_BILLING_PLACEHOLDERS;
  }

  isWebhookPlaceholderEnabled() {
    return this.getFeatureFlags().ENABLE_WEBHOOK_PLACEHOLDER;
  }

  isSmsPlaceholderEnabled() {
    return this.getFeatureFlags().ENABLE_SMS_PLACEHOLDER;
  }

  isDebugLogsEnabled() {
    return this.getFeatureFlags().ENABLE_DEBUG_LOGS;
  }

  logValidationWarnings() {
    const summary = this.getValidationSummary();
    for (const warning of summary.warnings) {
      this.logger.warn(warning);
    }
    return summary;
  }

  getPublicSummary() {
    const flags = this.getFeatureFlags();
    const validation = this.getValidationSummary();

    return {
      environment: this.environment,
      featureFlags: flags,
      warnings: validation.warnings,
      errors: validation.errors,
    };
  }
}

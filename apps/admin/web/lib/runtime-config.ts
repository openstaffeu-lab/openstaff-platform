function parseBooleanFlag(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

const isProduction = process.env.NODE_ENV === "production";

export function isDemoModeEnabled() {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_DEMO_MODE, false);
}

export function isAiFallbackEnabled() {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_AI_FALLBACK, !isProduction);
}

export function isDemoPublicFeedEnabled() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_DEMO_PUBLIC_FEED,
    isDemoModeEnabled() && !isProduction,
  );
}

export function isDemoMessagingEnabled() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MESSAGING,
    isDemoModeEnabled() && !isProduction,
  );
}

export function isBillingPlaceholdersEnabled() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_BILLING_PLACEHOLDERS,
    !isProduction,
  );
}

export function isWebhookPlaceholderEnabled() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_WEBHOOK_PLACEHOLDER,
    !isProduction,
  );
}

export function isSmsPlaceholderEnabled() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_SMS_PLACEHOLDER,
    !isProduction,
  );
}

export function isDebugLogsEnabled() {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS, !isProduction);
}

export function getPublicRuntimeConfigSummary() {
  return {
    environment: process.env.NODE_ENV ?? "development",
    demoMode: isDemoModeEnabled(),
    aiFallback: isAiFallbackEnabled(),
    demoPublicFeed: isDemoPublicFeedEnabled(),
    demoMessaging: isDemoMessagingEnabled(),
    billingPlaceholders: isBillingPlaceholdersEnabled(),
    webhookPlaceholder: isWebhookPlaceholderEnabled(),
    smsPlaceholder: isSmsPlaceholderEnabled(),
    debugLogs: isDebugLogsEnabled(),
  };
}

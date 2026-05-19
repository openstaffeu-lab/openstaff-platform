import { Injectable } from '@nestjs/common';
import { getApiCorsOrigins, PRODUCTION_SECRETS } from './app.config';
import { RuntimeConfigService } from './config/runtime-config.service';
import { PrismaService } from './prisma/prisma.service';

type ComponentStatus =
  | 'implemented'
  | 'configured'
  | 'ready'
  | 'in_progress'
  | 'not_required'
  | 'missing';
type ReadinessStatus =
  | 'healthy'
  | 'ready'
  | 'configured'
  | 'in_progress'
  | 'not_required'
  | 'missing'
  | 'error';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  getRoot() {
    return {
      status: 'ok',
      service: 'openstaff-api',
      message: 'OpenStaff API is running.',
      endpoints: ['/health', '/status'],
    };
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'openstaff-api',
      environment: this.runtimeConfig.environment,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getStatus() {
    let db: 'healthy' | 'error' = 'healthy';
    let notificationQueue = { pending: 0, failed: 0 };
    let reluQueue = { pending: 0, failed: 0 };
    let workflowRuns = { total: 0, failed: 0 };
    let securitySummary = { openEvents: 0, criticalEvents: 0, activeSessions: 0, complianceRequests: 0 };
    let rolloutIntelligence = this.emptyRolloutIntelligence();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
      const [
        pending,
        failed,
        reluPending,
        reluFailed,
        workflowTotal,
        workflowFailed,
        openEvents,
        criticalEvents,
        activeSessions,
        complianceRequests,
        landingPageVisits24h,
        registerStarted24h,
        registerCompleted24h,
        onboardingCompleted24h,
        profileCompleted24h,
        publishStarted24h,
        publishSubmitted24h,
        publishApproved24h,
        upgradeRequested24h,
        upgradeApproved24h,
        uploadFailures24h,
        onboardingNotStarted,
        onboardingInProgress,
        onboardingCompletedTotal,
        pendingPosts,
        rejectedPosts,
        pendingMedia,
        rejectedMedia,
        pendingDocuments,
        rejectedDocuments,
        upgradeRequestPending,
        upgradeRequestContacted,
        upgradeRequestApproved,
        loginFailures24h,
        loginFailures15m,
        rateLimit15m,
        webhookFailures24h,
        operatorEscalations24h,
        repeatedConfusion24h,
        feedbackItems24h,
        recentOperatorActions,
      ] =
        await Promise.all([
          this.prisma.notificationDelivery.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.notificationDelivery.count({
            where: { status: 'FAILED' as any },
          }),
          this.prisma.reluTask.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.reluTask.count({
            where: { status: 'FAILED' as any },
          }),
          this.prisma.workflowAutomationRun.count(),
          this.prisma.workflowAutomationRun.count({
            where: { status: 'FAILED' as any },
          }),
          this.prisma.securityEvent.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.securityEvent.count({
            where: { severity: 'CRITICAL' as any },
          }),
          this.prisma.userSession.count({
            where: { revokedAt: null },
          }),
          this.prisma.complianceRequest.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'LANDING_PAGE_VISIT', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'REGISTER_STARTED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'REGISTER_COMPLETED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'ONBOARDING_COMPLETED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'PROFILE_COMPLETED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'PUBLISH_STARTED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'PUBLISH_SUBMITTED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'PUBLISH_APPROVED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'UPGRADE_REQUESTED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'SUBSCRIPTION_UPGRADE_APPROVED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: { eventType: 'UPLOAD_FAILED', createdAt: { gte: last24Hours } },
          }),
          this.prisma.onboardingSession.count({
            where: { status: 'NOT_STARTED' as any },
          }),
          this.prisma.onboardingSession.count({
            where: { status: 'IN_PROGRESS' as any },
          }),
          this.prisma.onboardingSession.count({
            where: { status: 'COMPLETED' as any },
          }),
          this.prisma.publicPost.count({
            where: { moderationStatus: 'PENDING' as any },
          }),
          this.prisma.publicPost.count({
            where: { moderationStatus: 'REJECTED' as any },
          }),
          this.prisma.publicPostMedia.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.publicPostMedia.count({
            where: { status: 'REJECTED' as any },
          }),
          this.prisma.publicPostDocument.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.publicPostDocument.count({
            where: { status: 'REJECTED' as any },
          }),
          this.prisma.subscriptionUpgradeRequest.count({
            where: { status: 'PENDING' as any },
          }),
          this.prisma.subscriptionUpgradeRequest.count({
            where: { status: 'CONTACTED' as any },
          }),
          this.prisma.subscriptionUpgradeRequest.count({
            where: { status: 'APPROVED' as any },
          }),
          this.prisma.securityEvent.count({
            where: { type: 'LOGIN_FAILED' as any, createdAt: { gte: last24Hours } },
          }),
          this.prisma.securityEvent.count({
            where: { type: 'LOGIN_FAILED' as any, createdAt: { gte: last15Minutes } },
          }),
          this.prisma.securityEvent.count({
            where: { type: 'RATE_LIMIT_TRIGGERED' as any, createdAt: { gte: last15Minutes } },
          }),
          this.prisma.billingWebhookEvent.count({
            where: { status: 'FAILED' as any, createdAt: { gte: last24Hours } },
          }),
          this.prisma.notificationEvent.count({
            where: {
              eventType: 'OPERATIONAL_FEEDBACK_OPERATOR_ESCALATION',
              createdAt: { gte: last24Hours },
            },
          }),
          this.prisma.notificationEvent.count({
            where: {
              eventType: 'OPERATIONAL_FEEDBACK_REPEATED_USER_CONFUSION',
              createdAt: { gte: last24Hours },
            },
          }),
          this.prisma.notificationEvent.count({
            where: {
              sourceType: 'OPERATIONAL_FEEDBACK',
              createdAt: { gte: last24Hours },
            },
          }),
          this.prisma.auditLog.findMany({
            orderBy: [{ createdAt: 'desc' }],
            take: 8,
            where: {
              actorUser: {
                role: { in: ['ADMIN', 'SUPERADMIN'] as any },
              },
            },
            select: {
              createdAt: true,
              action: true,
              category: true,
              entityType: true,
              actorUser: {
                select: {
                  email: true,
                  role: true,
                },
              },
            },
          }),
        ]);

      notificationQueue = { pending, failed };
      reluQueue = { pending: reluPending, failed: reluFailed };
      workflowRuns = { total: workflowTotal, failed: workflowFailed };
      securitySummary = { openEvents, criticalEvents, activeSessions, complianceRequests };
      rolloutIntelligence = {
        windowHours: 24,
        funnel: {
          landingPageVisits24h,
          registerStarted24h,
          registerCompleted24h,
          onboardingCompleted24h,
          profileCompleted24h,
          publishStarted24h,
          publishSubmitted24h,
          publishApproved24h,
          upgradeRequested24h,
          upgradeApproved24h,
          loginFailures24h,
          uploadFailures24h,
        },
        operations: {
          onboarding: {
            notStarted: onboardingNotStarted,
            inProgress: onboardingInProgress,
            completed: onboardingCompletedTotal,
          },
          moderation: {
            pendingPosts,
            rejectedPosts,
            pendingMedia,
            rejectedMedia,
            pendingDocuments,
            rejectedDocuments,
            pendingTotal: pendingPosts + pendingMedia + pendingDocuments,
            rejectedTotal: rejectedPosts + rejectedMedia + rejectedDocuments,
          },
          upgrades: {
            pending: upgradeRequestPending,
            contacted: upgradeRequestContacted,
            approved: upgradeRequestApproved,
          },
          failures: {
            uploadFailures24h,
            loginFailures24h,
            loginFailures15m,
            rateLimitTriggers15m: rateLimit15m,
            webhookFailures24h,
          },
          feedback: {
            total24h: feedbackItems24h,
            operatorEscalations24h,
            repeatedConfusion24h,
          },
          recentOperatorActions: recentOperatorActions.map((item) => ({
            createdAt: item.createdAt,
            action: item.action,
            category: item.category,
            entityType: item.entityType,
            actorEmail: item.actorUser?.email ?? 'unknown',
            actorRole: item.actorUser?.role ?? 'unknown',
          })),
        },
      };
    } catch {
      // Status should still render even if some optional tables are unavailable.
    }

    const runtimeSummary = this.runtimeConfig.getPublicSummary();

    return {
      status: db === 'healthy' ? 'ok' : 'error',
      api: 'ok',
      db,
      service: 'openstaff-api',
      timestamp: new Date().toISOString(),
      runtime: {
        nodeEnv: this.runtimeConfig.environment,
        port: Number(process.env.PORT ?? 8080),
        authMode:
          process.env.SKIP_FIREBASE_AUTH === 'true'
            ? 'firebase-skip-dev'
            : 'firebase-admin',
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
        storageBucketConfigured: Boolean(process.env.STORAGE_BUCKET),
        rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
        rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 20),
      },
      featureFlags: runtimeSummary.featureFlags,
      readiness: {
        warnings: runtimeSummary.warnings,
        errors: runtimeSummary.errors,
      },
      cors: {
        allowedOrigins: getApiCorsOrigins(),
      },
      integrations: {
        firebaseAuth: this.getFirebaseAuthStatus(),
        firestore: 'not_required',
        cloudStorage: this.getCloudStorageStatus(),
        secretManager: this.getSecretManagerStatus(),
        commercial: this.getCommercialReadinessSummary(),
        gemini: {
          apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
          fallbackEnabled: this.runtimeConfig.isAiFallbackEnabled(),
        },
        billingWebhook: {
          mode: this.getBillingWebhookMode(),
          provider: 'stripe',
          signatureVerification: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
            ? 'enabled'
            : 'disabled',
          autoProcessing: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
            ? 'enabled'
            : 'disabled',
          placeholderEnabled: this.runtimeConfig.isWebhookPlaceholderEnabled(),
          secretsConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        },
        billingPlaceholders: {
          enabled: this.runtimeConfig.isBillingPlaceholdersEnabled(),
          mode: this.runtimeConfig.isBillingPlaceholdersEnabled()
            ? 'manual_only'
            : 'disabled',
        },
        billingPayments: {
          mode: this.getPublicBillingMode(),
          providerBackedCheckout: this.hasStripeCheckoutProviderConfigured(),
          operatorOverrideEnabled: true,
        },
        emailDelivery: {
          mode: this.getEmailDeliveryMode(),
          provider: this.getEmailDeliveryMode() === 'configured' ? 'configured_provider' : 'not_configured',
        },
        smsDelivery: {
          mode: this.getSmsDeliveryMode(),
          provider: 'not_configured',
          publicEnabled: false,
          placeholderEnabled: this.runtimeConfig.isSmsPlaceholderEnabled(),
        },
      },
      queues: {
        notifications: notificationQueue,
        relu: reluQueue,
        workflowAutomation: workflowRuns,
      },
      security: securitySummary,
      rolloutIntelligence,
      components: [
        this.component('auth', 'implemented', '/auth'),
        this.component('projects', 'implemented', '/projects'),
        this.component('profiles', 'implemented', '/profiles'),
        this.component('public-posts', 'implemented', '/public-posts'),
        this.component('public-feedback', 'implemented', '/public-comments, /public-reviews'),
        this.component('admin-moderation', 'implemented', '/admin/*'),
        this.component('notifications', 'implemented', '/notifications'),
        this.component('audit', 'implemented', '/projects/:projectId/audit-logs'),
      ],
    };
  }

  private component(name: string, status: ComponentStatus, route: string) {
    return { name, status, route };
  }

  private getCloudStorageStatus(): ReadinessStatus {
    return process.env.STORAGE_BUCKET?.trim() ? 'configured' : 'missing';
  }

  private getFirebaseAuthStatus(): ReadinessStatus {
    const hasInlineServiceAccount = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim(),
    );
    const hasServiceAccountPath = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim(),
    );
    const hasGoogleCredentials = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    );

    return hasInlineServiceAccount || hasServiceAccountPath || hasGoogleCredentials
      ? 'configured'
      : 'missing';
  }

  private getSecretManagerStatus(): ReadinessStatus {
    const runningOnGcp = Boolean(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT);

    if (!runningOnGcp) {
      return 'missing';
    }

    const missingSecrets = PRODUCTION_SECRETS.filter(
      (secretName) => !process.env[secretName]?.trim(),
    );

    return missingSecrets.length === 0 ? 'ready' : 'in_progress';
  }

  private hasStripeCheckoutProviderConfigured() {
    return Boolean(
      process.env.STRIPE_SECRET_KEY?.trim() ||
        process.env.STRIPE_API_KEY?.trim(),
    );
  }

  private getPublicBillingMode() {
    return this.hasStripeCheckoutProviderConfigured() ? 'provider_backed' : 'manual_only';
  }

  private getBillingWebhookMode() {
    if (Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim())) {
      return 'configured';
    }

    return this.runtimeConfig.isWebhookPlaceholderEnabled()
      ? 'manual_only'
      : 'not_configured';
  }

  private getEmailDeliveryMode() {
    const hasProvider = Boolean(
      process.env.SMTP_URL?.trim() ||
        process.env.RESEND_API_KEY?.trim() ||
        process.env.SENDGRID_API_KEY?.trim() ||
        process.env.MAILGUN_API_KEY?.trim(),
    );

    return hasProvider ? 'configured' : 'not_configured';
  }

  private getSmsDeliveryMode() {
    const hasProvider = Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim(),
    );

    if (hasProvider) {
      return 'configured';
    }

    return this.runtimeConfig.isSmsPlaceholderEnabled() ? 'manual_only' : 'not_required';
  }

  private getCommercialReadinessSummary() {
    return {
      launchMode: this.getPublicBillingMode(),
      publicUpgradeFlow: this.hasStripeCheckoutProviderConfigured()
        ? 'direct_checkout'
        : 'request_upgrade',
      operatorReviewRequired: !this.hasStripeCheckoutProviderConfigured(),
      webhookProvider: this.getBillingWebhookMode() === 'configured' ? 'stripe' : 'not_configured',
      emailDelivery: this.getEmailDeliveryMode(),
      smsDelivery: this.getSmsDeliveryMode(),
    };
  }

  private emptyRolloutIntelligence() {
    return {
      windowHours: 24,
      funnel: {
        landingPageVisits24h: 0,
        registerStarted24h: 0,
        registerCompleted24h: 0,
        onboardingCompleted24h: 0,
        profileCompleted24h: 0,
        publishStarted24h: 0,
        publishSubmitted24h: 0,
        publishApproved24h: 0,
        upgradeRequested24h: 0,
        upgradeApproved24h: 0,
        loginFailures24h: 0,
        uploadFailures24h: 0,
      },
      operations: {
        onboarding: {
          notStarted: 0,
          inProgress: 0,
          completed: 0,
        },
        moderation: {
          pendingPosts: 0,
          rejectedPosts: 0,
          pendingMedia: 0,
          rejectedMedia: 0,
          pendingDocuments: 0,
          rejectedDocuments: 0,
          pendingTotal: 0,
          rejectedTotal: 0,
        },
        upgrades: {
          pending: 0,
          contacted: 0,
          approved: 0,
        },
        failures: {
          uploadFailures24h: 0,
          loginFailures24h: 0,
          loginFailures15m: 0,
          rateLimitTriggers15m: 0,
          webhookFailures24h: 0,
        },
        feedback: {
          total24h: 0,
          operatorEscalations24h: 0,
          repeatedConfusion24h: 0,
        },
        recentOperatorActions: [] as Array<{
          createdAt: Date;
          action: string;
          category: string | null;
          entityType: string;
          actorEmail: string;
          actorRole: string;
        }>,
      },
    };
  }
}

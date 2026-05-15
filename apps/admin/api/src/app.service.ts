import { Injectable } from '@nestjs/common';
import { API_CORS_ORIGINS } from './app.config';
import { RuntimeConfigService } from './config/runtime-config.service';
import { PrismaService } from './prisma/prisma.service';

type ComponentStatus = 'implemented' | 'in_progress' | 'missing';

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
    let db: 'ok' | 'error' = 'ok';
    let notificationQueue = { pending: 0, failed: 0 };
    let reluQueue = { pending: 0, failed: 0 };
    let workflowRuns = { total: 0, failed: 0 };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    try {
      const [pending, failed, reluPending, reluFailed, workflowTotal, workflowFailed] =
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
        ]);

      notificationQueue = { pending, failed };
      reluQueue = { pending: reluPending, failed: reluFailed };
      workflowRuns = { total: workflowTotal, failed: workflowFailed };
    } catch {
      // Status should still render even if some optional tables are unavailable.
    }

    const runtimeSummary = this.runtimeConfig.getPublicSummary();

    return {
      status: db === 'ok' ? 'ok' : 'error',
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
      },
      featureFlags: runtimeSummary.featureFlags,
      readiness: {
        warnings: runtimeSummary.warnings,
        errors: runtimeSummary.errors,
      },
      cors: {
        allowedOrigins: API_CORS_ORIGINS,
      },
      integrations: {
        firebaseAuth: this.getComponentStatus(false),
        firestore: this.getComponentStatus(false),
        cloudStorage: this.getComponentStatus(Boolean(process.env.STORAGE_BUCKET)),
        secretManager: this.getComponentStatus(
          Boolean(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT),
        ),
        gemini: {
          apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
          fallbackEnabled: this.runtimeConfig.isAiFallbackEnabled(),
        },
        billingWebhook: {
          placeholderEnabled: this.runtimeConfig.isWebhookPlaceholderEnabled(),
          secretsConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        },
        billingPlaceholders: {
          enabled: this.runtimeConfig.isBillingPlaceholdersEnabled(),
        },
        smsDelivery: {
          placeholderEnabled: this.runtimeConfig.isSmsPlaceholderEnabled(),
        },
      },
      queues: {
        notifications: notificationQueue,
        relu: reluQueue,
        workflowAutomation: workflowRuns,
      },
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

  private getComponentStatus(isConfigured: boolean): ComponentStatus {
    return isConfigured ? 'in_progress' : 'missing';
  }
}

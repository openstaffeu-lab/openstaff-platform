import { Injectable } from '@nestjs/common';
import { API_CORS_ORIGINS } from './app.config';
import { PrismaService } from './prisma/prisma.service';

type ComponentStatus = 'implemented' | 'in_progress' | 'missing';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

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
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getStatus() {
    let db: 'ok' | 'error' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    return {
      status: db === 'ok' ? 'ok' : 'error',
      api: 'ok',
      db,
      service: 'openstaff-api',
      timestamp: new Date().toISOString(),
      runtime: {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: Number(process.env.PORT ?? 8080),
        authMode:
          process.env.SKIP_FIREBASE_AUTH === 'true'
            ? 'firebase-skip-dev'
            : 'firebase-admin',
        databaseConfigured: Boolean(process.env.DATABASE_URL),
        jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
        storageBucketConfigured: Boolean(process.env.STORAGE_BUCKET),
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

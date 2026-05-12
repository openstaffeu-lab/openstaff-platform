/** @deprecated Legacy Firebase Actor guard. Do not add new functionality here. */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ActorType, PlatformRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getFirebaseAdminAuth } from './firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isDevBypass =
      (process.env.NODE_ENV ?? 'development') === 'development' &&
      process.env.SKIP_FIREBASE_AUTH === 'true';

    if (isDevBypass) {
      const firebaseUid = process.env.DEV_FIREBASE_UID ?? 'dev-uid-001';
      const email = process.env.DEV_FIREBASE_EMAIL ?? 'dev@openstaff.eu';
      const actor = await this.prisma.actor.upsert({
        where: { firebaseUid },
        update: {
          email,
          displayName: 'OpenStaff Dev Admin',
          actorType: ActorType.INDIVIDUAL,
          role: PlatformRole.SUPERADMIN,
          isVerified: true,
          onboardingDone: true,
          onboardingStep: 5,
          countryCode: 'RO',
          languageCode: 'ro',
          regionCode: 'B',
        },
        create: {
          firebaseUid,
          email,
          displayName: 'OpenStaff Dev Admin',
          actorType: ActorType.INDIVIDUAL,
          role: PlatformRole.SUPERADMIN,
          isVerified: true,
          onboardingDone: true,
          onboardingStep: 5,
          countryCode: 'RO',
          languageCode: 'ro',
          regionCode: 'B',
          currency: 'RON',
        },
      });

      request.firebaseUser = {
        uid: firebaseUid,
        email,
      };
      request.actor = {
        ...actor,
        role: PlatformRole.SUPERADMIN,
      };
      request.user = {
        sub: request.actor.id,
        firebaseUid,
        email,
        role: PlatformRole.SUPERADMIN,
      };

      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
      request.firebaseUser = decoded;

      const actor = await this.prisma.actor.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!actor) {
        const isActorBootstrapRoute =
          request.method === 'POST' &&
          (request.route?.path === '/actors' || request.path === '/actors');

        if (isActorBootstrapRoute) {
          return true;
        }

        throw new UnauthorizedException('Actor not found for authenticated Firebase user');
      }

      request.actor = actor;
      request.user = {
        sub: actor.id,
        firebaseUid: actor.firebaseUid,
        email: actor.email,
        role: actor.role,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        `Firebase token verification failed: ${(error as Error).message}`,
      );
    }
  }
}

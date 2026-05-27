import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { VerifyActorDto } from './dto/verify-actor.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ActorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    type?: string;
    verified?: boolean;
    region?: string;
    nace?: string;
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const where = {
      ...(query.type ? { actorType: query.type as any } : {}),
      ...(typeof query.verified === 'boolean'
        ? { isVerified: query.verified }
        : {}),
      ...(query.region ? { regionCode: query.region } : {}),
      ...(query.nace ? { naceCode: query.nace } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.actor.findMany({
        where,
        include: { companyProfile: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.actor.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      data: items,
      items,
    };
  }

  async findOne(id: string, currentActor: any | null) {
    const actor = await this.prisma.actor.findUnique({
      where: { id },
      include: { companyProfile: true, documents: true },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    const isOwner = currentActor?.id === actor.id;
    const isAdmin = this.isAdmin(currentActor);

    if (isOwner || isAdmin) {
      return actor;
    }

    return {
      id: actor.id,
      actorType: actor.actorType,
      displayName: actor.displayName,
      avatarUrl: actor.avatarUrl,
      countryCode: actor.countryCode,
      regionCode: actor.regionCode,
      languageCode: actor.languageCode,
      naceCode: actor.naceCode,
      naceDescription: actor.naceDescription,
      escoOccupations: actor.escoOccupations,
      uniclassCode: actor.uniclassCode,
      bio: actor.bio,
      experienceYears: actor.experienceYears,
      rating: actor.rating,
      reviewCount: actor.reviewCount,
      isVerified: actor.isVerified,
      verifiedAt: actor.verifiedAt,
      companyProfile: actor.companyProfile
        ? {
            name: actor.companyProfile.name,
            legalType: actor.companyProfile.legalType,
            statusFirma: actor.companyProfile.statusFirma,
            obiectActivitate: actor.companyProfile.obiectActivitate,
          }
        : null,
    };
  }

  async create(body: CreateActorDto, firebaseUser: any) {
    const firebaseUid = body.firebaseUid ?? firebaseUser.uid;
    const email = body.email ?? firebaseUser.email;

    if (!email) {
      throw new ConflictException('Email is required to create an actor');
    }

    const existing = await this.prisma.actor.findFirst({
      where: {
        OR: [{ firebaseUid }, { email }],
      },
    });

    if (existing) {
      throw new ConflictException(
        'Actor already exists for this Firebase user',
      );
    }

    return this.prisma.actor.create({
      data: {
        firebaseUid,
        email,
        phone: body.phone,
        avatarUrl: body.avatarUrl,
        actorType: body.actorType,
        countryCode: body.countryCode ?? 'RO',
        regionCode: body.regionCode,
        languageCode: body.languageCode ?? 'ro',
        vatNumber: body.vatNumber,
        vatRegistered: body.vatRegistered ?? false,
        currency: body.currency ?? 'RON',
        naceCode: body.naceCode,
        naceDescription: body.naceDescription,
        escoOccupations: body.escoOccupations ?? [],
        uniclassCode: body.uniclassCode,
        displayName: body.displayName,
        bio: body.bio,
        experienceYears: body.experienceYears,
        onboardingStep: body.onboardingStep ?? 1,
        onboardingDone: body.onboardingDone ?? false,
        role: body.role ?? 'USER',
        companyProfile: body.companyProfile
          ? {
              create: {
                ...body.companyProfile,
                currency:
                  body.companyProfile.currency ?? body.currency ?? 'RON',
                statusFirma: body.companyProfile.statusFirma ?? 'ACTIVA',
                obiectActivitate: body.companyProfile.obiectActivitate ?? [],
                certificariUrls: body.companyProfile.certificariUrls ?? [],
                serviciiIds: body.companyProfile.serviciiIds ?? [],
              },
            }
          : undefined,
      },
      include: { companyProfile: true },
    });
  }

  async update(id: string, body: UpdateActorDto, currentActor: any) {
    const actor = await this.prisma.actor.findUnique({
      where: { id },
      include: { companyProfile: true },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (!this.isAdmin(currentActor) && currentActor?.id !== id) {
      throw new ForbiddenException(
        'You do not have permission to update this actor',
      );
    }

    return this.prisma.actor.update({
      where: { id },
      data: {
        phone: body.phone,
        avatarUrl: body.avatarUrl,
        actorType: body.actorType,
        countryCode: body.countryCode,
        regionCode: body.regionCode,
        languageCode: body.languageCode,
        vatNumber: body.vatNumber,
        vatRegistered: body.vatRegistered,
        currency: body.currency,
        naceCode: body.naceCode,
        naceDescription: body.naceDescription,
        escoOccupations: body.escoOccupations,
        uniclassCode: body.uniclassCode,
        displayName: body.displayName,
        bio: body.bio,
        experienceYears: body.experienceYears,
        onboardingStep: body.onboardingStep,
        onboardingDone: body.onboardingDone,
        isVerified: body.isVerified,
        role: body.role,
        companyProfile: body.companyProfile
          ? {
              upsert: {
                update: {
                  ...body.companyProfile,
                },
                create: {
                  name: body.companyProfile.name ?? actor.displayName,
                  legalType: body.companyProfile.legalType ?? 'SRL',
                  cui: body.companyProfile.cui ?? `${id}-cui`,
                  currency: body.companyProfile.currency ?? actor.currency,
                  statusFirma: body.companyProfile.statusFirma ?? 'ACTIVA',
                  obiectActivitate: body.companyProfile.obiectActivitate ?? [],
                  certificariUrls: body.companyProfile.certificariUrls ?? [],
                  serviciiIds: body.companyProfile.serviciiIds ?? [],
                },
              },
            }
          : undefined,
      },
      include: { companyProfile: true },
    });
  }

  async verify(id: string, body: VerifyActorDto, currentActor: any) {
    if (!this.isAdmin(currentActor)) {
      throw new ForbiddenException('Admin role required');
    }

    const actor = await this.prisma.actor.update({
      where: { id },
      data: {
        isVerified: body.verified ?? true,
        verifiedAt: body.verified === false ? null : new Date(),
      },
    });

    await this.notificationService.createActorNotification({
      actorId: actor.id,
      type: body.verified === false ? 'ACTOR_REJECTED' : 'ACTOR_VERIFIED',
      title: body.verified === false ? 'Actor rejected' : 'Actor verified',
      message:
        body.reason ??
        (body.verified === false
          ? 'Your actor profile requires corrections before approval.'
          : 'Your actor profile has been verified successfully.'),
    });

    return actor;
  }

  async me(currentActor: any) {
    if (!currentActor) {
      throw new NotFoundException('Current actor not found');
    }

    if (currentActor.id && currentActor.id !== 'dev-actor-001') {
      return this.findOne(currentActor.id, currentActor);
    }

    if (currentActor.firebaseUid) {
      const actor = await this.prisma.actor.findUnique({
        where: { firebaseUid: currentActor.firebaseUid },
      });

      if (actor) {
        return this.findOne(actor.id, actor);
      }
    }

    return this.findOne(currentActor.id, currentActor);
  }

  async getStats() {
    const [
      totalActors,
      pendingActors,
      verifiedActors,
      individualActors,
      companyActors,
      publicInstitutionActors,
    ] = await Promise.all([
      this.prisma.actor.count(),
      this.prisma.actor.count({ where: { isVerified: false } }),
      this.prisma.actor.count({ where: { isVerified: true } }),
      this.prisma.actor.count({ where: { actorType: 'INDIVIDUAL' } }),
      this.prisma.actor.count({ where: { actorType: 'COMPANY' } }),
      this.prisma.actor.count({ where: { actorType: 'PUBLIC_INSTITUTION' } }),
    ]);

    return {
      totalActors,
      pendingActors,
      verifiedActors,
      byType: {
        INDIVIDUAL: individualActors,
        COMPANY: companyActors,
        PUBLIC_INSTITUTION: publicInstitutionActors,
      },
    };
  }

  private isAdmin(actor: any) {
    return ['ADMIN', 'SUPERADMIN', 'COMPLIANCE_OFFICER'].includes(actor?.role);
  }
}

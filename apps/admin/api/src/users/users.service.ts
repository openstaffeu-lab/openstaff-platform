import {
  AccountApprovalStatus,
  AccountLifecycleStatus,
  Prisma,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  Role,
} from '@prisma/client';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { APP_MANAGED_ROLES } from '../access-control/access-control.constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        twoFactorSettings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      approvedAt: user.approvedAt,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      twoFactor: user.twoFactorSettings
        ? {
            enabled: user.twoFactorSettings.enabled,
            adminEnforced: user.twoFactorSettings.adminEnforced,
            emailOtpEnabled: user.twoFactorSettings.emailOtpEnabled,
            lastChallengeVerifiedAt: user.twoFactorSettings.lastChallengeVerifiedAt,
            failedAttemptCount: user.twoFactorSettings.failedAttemptCount,
            lockoutUntil: user.twoFactorSettings.lockoutUntil,
          }
        : null,
      profile: user.profile
        ? {
            id: user.profile.id,
            slug: user.profile.slug,
            displayName: user.profile.displayName,
            companyName: user.profile.companyName,
            profileType: user.profile.profileType,
            visibility: user.profile.visibility,
            moderationStatus: user.profile.moderationStatus,
            status: user.profile.status,
          }
        : null,
    }));
  }

  async findAllAdminUsers() {
    return this.findAll();
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async updateRole(userId: string, role: Role) {
    if (!APP_MANAGED_ROLES.includes(role)) {
      throw new Error('Role is not assignable from the admin panel');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        profile: true,
      },
    });
  }

  async updateApproval(userId: string, approvalStatus: AccountApprovalStatus) {
    const existing = await this.findById(userId);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const nextAccountStatus =
      approvalStatus === AccountApprovalStatus.REJECTED
        ? AccountLifecycleStatus.SUSPENDED
        : existing.accountStatus;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus,
        approvedAt:
          approvalStatus === AccountApprovalStatus.APPROVED ? new Date() : null,
        accountStatus: nextAccountStatus,
      },
      include: {
        profile: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      approvedAt: user.approvedAt,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            slug: user.profile.slug,
            displayName: user.profile.displayName,
            companyName: user.profile.companyName,
            profileType: user.profile.profileType,
            visibility: user.profile.visibility,
            moderationStatus: user.profile.moderationStatus,
            status: user.profile.status,
          }
        : null,
    };
  }

  async updateAccountStatus(userId: string, accountStatus: AccountLifecycleStatus) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus,
        suspendedAt:
          accountStatus === AccountLifecycleStatus.SUSPENDED ? new Date() : null,
      },
      include: {
        profile: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
      approvedAt: user.approvedAt,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            slug: user.profile.slug,
            displayName: user.profile.displayName,
            companyName: user.profile.companyName,
            profileType: user.profile.profileType,
            visibility: user.profile.visibility,
            moderationStatus: user.profile.moderationStatus,
            status: user.profile.status,
          }
        : null,
    };
  }

  async updateProfileModeration(
    userId: string,
    moderationStatus: ProfileModerationStatus,
    status: ProfileLifecycleStatus,
  ) {
    const existing = await this.findById(userId);

    if (!existing?.profile) {
      throw new NotFoundException('Profile not found');
    }

    const profile = await this.prisma.profile.update({
      where: { id: existing.profile.id },
      data: {
        moderationStatus,
        status,
        approvedAt:
          moderationStatus === ProfileModerationStatus.APPROVED ? new Date() : null,
      },
    });

    return {
      userId,
      profile: {
        id: profile.id,
        slug: profile.slug,
        displayName: profile.displayName,
        companyName: profile.companyName,
        profileType: profile.profileType,
        visibility: profile.visibility,
        moderationStatus: profile.moderationStatus,
        status: profile.status,
      },
    };
  }
}

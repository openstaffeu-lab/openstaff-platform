/** @deprecated Legacy auth service boundary. Do not add new functionality here. */
import {
  AccountApprovalStatus,
  AccountLifecycleStatus,
  ProfileLifecycleStatus,
  ProfileModerationStatus,
  ProfileType,
  ProfileVisibility,
  Role,
} from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

type RegisterPayload = {
  email: string;
  password: string;
  profileType: ProfileType;
  role?: Role;
  displayName: string;
  companyName?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterPayload) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const role = data.role ?? this.mapProfileTypeToRole(data.profileType);
    const displayName = data.displayName.trim();
    const companyName = data.companyName?.trim() || null;
    const slugBase = companyName || displayName || normalizedEmail.split('@')[0];
    const slug = await this.generateUniqueProfileSlug(slugBase);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role,
          approvalStatus: AccountApprovalStatus.PENDING,
          accountStatus: AccountLifecycleStatus.OFFLINE,
        },
      });

      await tx.profile.create({
        data: {
          userId: createdUser.id,
          slug,
          profileType: data.profileType,
          displayName,
          companyName,
          visibility: ProfileVisibility.PRIVATE,
          moderationStatus: ProfileModerationStatus.PENDING,
          status: ProfileLifecycleStatus.OFFLINE,
        },
      });

      return createdUser;
    });

    return this.buildAuthResponse(user.id);
  }

  async login(data: LoginPayload) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.approvalStatus === AccountApprovalStatus.REJECTED) {
      throw new ForbiddenException('Your account has been rejected');
    }

    if (user.accountStatus === AccountLifecycleStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountStatus: AccountLifecycleStatus.LIVE,
        lastLoginAt: new Date(),
      },
    });

    return this.buildAuthResponse(user.id);
  }

  async getCurrentUser(userId: string) {
    return this.buildUserSummary(userId);
  }

  private async buildAuthResponse(userId: string) {
    const user = await this.buildUserSummary(userId);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      accountStatus: user.accountStatus,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  private async buildUserSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

  private async generateUniqueProfileSlug(value: string) {
    const normalized = this.slugify(value);
    let slug = normalized;
    let index = 2;

    while (
      await this.prisma.profile.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${normalized}-${index}`;
      index += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    return (
      value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `profile-${Date.now()}`
    );
  }

  private mapProfileTypeToRole(profileType: ProfileType) {
    if (
      profileType === ProfileType.CONTRACTOR ||
      profileType === ProfileType.SUBCONTRACTOR ||
      profileType === ProfileType.SUPPLIER ||
      profileType === ProfileType.GENERAL_CONTRACTOR
    ) {
      return Role.CONTRACTOR;
    }

    if (profileType === ProfileType.INVESTOR) {
      return Role.EMPLOYER;
    }

    return Role.PROFESSIONAL;
  }
}

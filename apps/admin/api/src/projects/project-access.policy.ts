import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type AuthenticatedUser = {
  sub: string;
  role: string;
};

@Injectable()
export class ProjectAccessPolicy {
  isAdmin(user: AuthenticatedUser) {
    return user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  }

  assertCanReadProject(user: AuthenticatedUser, projectOwnerId: string) {
    if (this.isAdmin(user)) {
      return;
    }

    if (user.sub !== projectOwnerId) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  assertCanWriteProject(user: AuthenticatedUser, projectOwnerId: string) {
    if (this.isAdmin(user)) {
      return;
    }

    if (user.sub !== projectOwnerId) {
      throw new ForbiddenException(
        'You do not have access to modify this project',
      );
    }
  }

  scopeProjectListWhere(
    user: AuthenticatedUser,
    where: Prisma.ProjectWhereInput,
    createdById?: string,
  ) {
    if (this.isAdmin(user)) {
      if (createdById) {
        where.createdById = createdById;
      }

      return where;
    }

    if (createdById && createdById !== user.sub) {
      throw new ForbiddenException('You can only request your own projects');
    }

    where.createdById = user.sub;
    return where;
  }
}

import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Permission } from '@prisma/client';
import { REQUIRED_PERMISSIONS_KEY } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ReluAiBuilderController } from './relu-ai-builder.controller';

describe('ReluAiBuilderController authorization', () => {
  it('requires JWT plus technical operations permission at controller level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      ReluAiBuilderController,
    );
    const permissions = Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      ReluAiBuilderController,
    );

    expect(guards).toEqual([JwtGuard, PermissionsGuard]);
    expect(permissions).toEqual([Permission.MANAGE_TECHNICAL_OPERATIONS]);
  });
});

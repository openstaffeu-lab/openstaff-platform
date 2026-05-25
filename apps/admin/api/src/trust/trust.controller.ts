import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { AdminTrustActionDto } from './dto/admin-trust-action.dto';
import { ConfirmTrustTokenDto } from './dto/confirm-trust-token.dto';
import { TrustService } from './trust.service';

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @UseGuards(JwtGuard)
  @Post('email-ownership/request')
  async requestEmailOwnershipVerification(@Req() req: any) {
    return buildSuccessResponse(
      await this.trustService.requestEmailOwnershipVerification(req.user.sub, req),
    );
  }

  @Post('email-ownership/confirm')
  async confirmEmailOwnership(@Body() body: ConfirmTrustTokenDto, @Req() req: any) {
    return buildSuccessResponse(
      await this.trustService.confirmEmailOwnership(body.token, req),
    );
  }

  @Post('suspicious-login/confirm')
  async confirmSuspiciousLogin(@Body() body: ConfirmTrustTokenDto, @Req() req: any) {
    return buildSuccessResponse(
      await this.trustService.confirmSuspiciousLogin(body.token, req),
    );
  }
}

@Controller('admin/users')
@UseGuards(JwtGuard, new RolesGuard([Role.ADMIN, Role.SUPERADMIN]))
export class TrustAdminController {
  constructor(private readonly trustService: TrustService) {}

  @Get(':userId/trust-summary')
  async getTrustSummary(@Param('userId') userId: string) {
    try {
      return buildSuccessResponse(await this.trustService.getAdminTrustSummary(userId));
    } catch (error) {
      logEndpointError('TrustAdminController.getTrustSummary', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Post(':userId/trust-action')
  async performTrustAction(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() body: AdminTrustActionDto,
  ) {
    try {
      return buildSuccessResponse(
        await this.trustService.performAdminTrustAction(userId, req.user.sub, body, req),
      );
    } catch (error) {
      logEndpointError('TrustAdminController.performTrustAction', error);
      return buildInternalErrorResponse(error);
    }
  }
}

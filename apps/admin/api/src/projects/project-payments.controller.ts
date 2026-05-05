import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateProjectPaymentStatusDto } from './dto/update-project-payment-status.dto';
import { ProjectContractsService } from './project-contracts.service';

@Controller('payments')
export class ProjectPaymentsController {
  constructor(private readonly projectContractsService: ProjectContractsService) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':paymentId/status')
  async updateStatus(
    @Param('paymentId') paymentId: string,
    @Body() body: UpdateProjectPaymentStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectContractsService.updatePaymentStatus(paymentId, body, user);
  }
}

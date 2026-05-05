import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';
import { ReluService } from './relu.service';

@Controller('relu')
export class ReluController {
  constructor(private readonly reluService: ReluService) {}

  @Post('process-actor')
  processActor(@Body() body: Record<string, unknown>) {
    return this.reluService.processActor(body);
  }

  @Post('process-job')
  processJob(@Body() body: Record<string, unknown>) {
    return this.reluService.processJob(body);
  }

  @Post('generate-test')
  generateTest(@Body() body: Record<string, unknown>) {
    return this.reluService.generateTest(body);
  }

  @Post('score-application')
  scoreApplication(@Body() body: Record<string, unknown>) {
    return this.reluService.scoreApplication(body);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Get('queue')
  queue() {
    return this.reluService.queueStatus();
  }
}

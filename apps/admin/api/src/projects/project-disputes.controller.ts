import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProjectDisputeDto } from './dto/create-project-dispute.dto';
import { CreateProjectDisputeEventDto } from './dto/create-project-dispute-event.dto';
import { UpdateProjectDisputeStatusDto } from './dto/update-project-dispute-status.dto';
import { ProjectDisputesService } from './project-disputes.service';

@Controller('projects')
export class ProjectDisputesController {
  constructor(
    private readonly projectDisputesService: ProjectDisputesService,
  ) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/disputes')
  async create(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Body() body: CreateProjectDisputeDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDisputesService.create(
      projectId,
      contractId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/disputes')
  async list(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    return this.projectDisputesService.list(projectId, contractId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/contracts/:contractId/disputes/:disputeId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Param('disputeId') disputeId: string,
    @Req() req: any,
  ) {
    return this.projectDisputesService.findOne(
      projectId,
      contractId,
      disputeId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Patch(':projectId/contracts/:contractId/disputes/:disputeId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Param('disputeId') disputeId: string,
    @Body() body: UpdateProjectDisputeStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDisputesService.updateStatus(
      projectId,
      contractId,
      disputeId,
      body,
      user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/contracts/:contractId/disputes/:disputeId/events')
  async addEvent(
    @Param('projectId') projectId: string,
    @Param('contractId') contractId: string,
    @Param('disputeId') disputeId: string,
    @Body() body: CreateProjectDisputeEventDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDisputesService.addEvent(
      projectId,
      contractId,
      disputeId,
      body,
      user,
    );
  }
}

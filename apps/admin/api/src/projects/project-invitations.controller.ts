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
import { CreateProjectInvitationDto } from './dto/create-project-invitation.dto';
import { UpdateProjectInvitationStatusDto } from './dto/update-project-invitation-status.dto';
import { ProjectInvitationsService } from './project-invitations.service';

@Controller('projects')
export class ProjectInvitationsController {
  constructor(private readonly projectInvitationsService: ProjectInvitationsService) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/invitations')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectInvitationDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectInvitationsService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Get(':projectId/invitations')
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectInvitationsService.list(projectId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch(':projectId/invitations/:invitationId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('invitationId') invitationId: string,
    @Body() body: UpdateProjectInvitationStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectInvitationsService.updateStatus(projectId, invitationId, body, user);
  }
}

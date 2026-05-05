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
import { CreateProjectProposalDto } from './dto/create-project-proposal.dto';
import { UpdateProjectProposalStatusDto } from './dto/update-project-proposal-status.dto';
import { ProjectProposalsService } from './project-proposals.service';

@Controller()
export class ProjectProposalsController {
  constructor(private readonly projectProposalsService: ProjectProposalsService) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('projects/:projectId/proposals')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectProposalDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectProposalsService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Get('projects/:projectId/proposals')
  async listForProject(@Param('projectId') projectId: string, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectProposalsService.listForProject(projectId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Get('profile/proposals')
  async listForCurrentProfile(@Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectProposalsService.listForCurrentProfile(user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('projects/:projectId/proposals/:proposalId/status')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @Body() body: UpdateProjectProposalStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.projectProposalsService.updateStatus(projectId, proposalId, body, user);
  }
}

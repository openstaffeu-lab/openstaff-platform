import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { MatchEngineService } from './match-engine.service';

@Controller('projects')
export class ProjectMatchesController {
  constructor(private readonly matchEngineService: MatchEngineService) {}

  @UseGuards(JwtGuard)
  @Get(':projectId/matches')
  async findProjectMatches(@Param('projectId') projectId: string, @Req() req: any) {
    return this.matchEngineService.getProjectMatches(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get(':projectId/job-requests/:jobRequestId/matches')
  async findJobRequestMatches(
    @Param('projectId') projectId: string,
    @Param('jobRequestId') jobRequestId: string,
    @Req() req: any,
  ) {
    return this.matchEngineService.getJobRequestMatches(projectId, jobRequestId, req.user);
  }
}

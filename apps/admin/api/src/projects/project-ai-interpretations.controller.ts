import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApplyProjectAIInterpretationDto } from './dto/apply-project-ai-interpretation.dto';
import { CreateProjectAIInterpretationDto } from './dto/create-project-ai-interpretation.dto';
import { ProjectAIInterpretationsService } from './project-ai-interpretations.service';

@Controller('projects/:projectId/ai-interpretation')
export class ProjectAIInterpretationsController {
  constructor(
    private readonly projectAIInterpretationsService: ProjectAIInterpretationsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async findOne(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectAIInterpretationsService.findOne(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('history')
  async findHistory(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectAIInterpretationsService.findHistory(
      projectId,
      req.user,
    );
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Put()
  async upsert(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectAIInterpretationDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectAIInterpretationsService.upsert(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post('apply')
  async apply(
    @Param('projectId') projectId: string,
    @Body() body: ApplyProjectAIInterpretationDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectAIInterpretationsService.apply(projectId, body, user);
  }
}

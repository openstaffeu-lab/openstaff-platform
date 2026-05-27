import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProjectShortlistDto } from './dto/create-project-shortlist.dto';
import { ProjectShortlistService } from './project-shortlist.service';

@Controller('projects')
export class ProjectShortlistController {
  constructor(
    private readonly projectShortlistService: ProjectShortlistService,
  ) {}

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':projectId/shortlist')
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectShortlistDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectShortlistService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Get(':projectId/shortlist')
  async list(@Param('projectId') projectId: string, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectShortlistService.list(projectId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Delete(':projectId/shortlist/:shortlistId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('shortlistId') shortlistId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectShortlistService.remove(projectId, shortlistId, user);
  }
}

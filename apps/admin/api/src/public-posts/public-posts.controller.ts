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
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { PublicPostsService } from './public-posts.service';

@Controller()
export class PublicPostsController {
  constructor(private readonly publicPostsService: PublicPostsService) {}

  @Get('public-posts')
  async findAll() {
    try {
      return await this.publicPostsService.findAll();
    } catch (error) {
      logEndpointError('PublicPostsController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/public-posts')
  async findAllForAdmin() {
    try {
      return await this.publicPostsService.findAllForAdmin();
    } catch (error) {
      logEndpointError('PublicPostsController.findAllForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/:id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.publicPostsService.findOne(id);
    } catch (error) {
      logEndpointError('PublicPostsController.findOne', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts')
  async create(@Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.create(body);
    } catch (error) {
      logEndpointError('PublicPostsController.create', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('public-posts/:id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.update(id, body);
    } catch (error) {
      logEndpointError('PublicPostsController.update', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/media')
  async addMedia(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.addMedia(id, body);
    } catch (error) {
      logEndpointError('PublicPostsController.addMedia', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/public-post-media')
  async listMediaForAdmin() {
    try {
      return await this.publicPostsService.listMediaForAdmin();
    } catch (error) {
      logEndpointError('PublicPostsController.listMediaForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/public-post-media/:id/status')
  async updateMediaStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    try {
      return await this.publicPostsService.updateMediaStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING',
      );
    } catch (error) {
      logEndpointError('PublicPostsController.updateMediaStatus', error);
      return buildInternalErrorResponse(error);
    }
  }
}

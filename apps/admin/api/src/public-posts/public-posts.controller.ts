import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import {
  PublicPostsService,
  UploadedMarketplaceFile,
} from './public-posts.service';
import { ModeratePublicPostDto } from './dto/moderate-public-post.dto';
import { ModeratePublicMediaDto } from './dto/moderate-public-media.dto';

@Controller()
export class PublicPostsController {
  constructor(private readonly publicPostsService: PublicPostsService) {}

  @Get('public-posts')
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('q') q?: string,
  ) {
    try {
      return await this.publicPostsService.findAll({ type, status, visibility, q });
    } catch (error) {
      logEndpointError('PublicPostsController.findAll', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/public-posts')
  async findAllForAdmin(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('q') q?: string,
  ) {
    try {
      return await this.publicPostsService.findAllForAdmin({ type, status, visibility, q });
    } catch (error) {
      logEndpointError('PublicPostsController.findAllForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/:id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.publicPostsService.findOne(id, req.user ?? null);
    } catch (error) {
      logEndpointError('PublicPostsController.findOne', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/media/:mediaId')
  async getMediaAsset(
    @Param('mediaId') mediaId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const file = await this.publicPostsService.getMediaAsset(mediaId, req.user ?? null);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      );
      return new StreamableFile(file.stream);
    } catch (error) {
      logEndpointError('PublicPostsController.getMediaAsset', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/documents/:documentId')
  async getDocumentAsset(
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const file = await this.publicPostsService.getDocumentAsset(documentId, req.user ?? null);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      );
      return new StreamableFile(file.stream);
    } catch (error) {
      logEndpointError('PublicPostsController.getDocumentAsset', error);
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
      return await this.publicPostsService.create(body, req.user);
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
      return await this.publicPostsService.update(id, body, req.user);
    } catch (error) {
      logEndpointError('PublicPostsController.update', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete('public-posts/:id')
  async remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.remove(id, req.user);
    } catch (error) {
      logEndpointError('PublicPostsController.remove', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/media')
  @UseInterceptors(FileInterceptor('file'))
  async addMedia(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMarketplaceFile | undefined,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.addMedia(id, body, file, req.user);
    } catch (error) {
      logEndpointError('PublicPostsController.addMedia', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async addDocument(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMarketplaceFile | undefined,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.addDocument(id, body, file, req.user);
    } catch (error) {
      logEndpointError('PublicPostsController.addDocument', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/external-links')
  async addExternalLink(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicPostsService.addExternalLink(id, body, req.user);
    } catch (error) {
      logEndpointError('PublicPostsController.addExternalLink', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/public-posts/:id/status')
  async updatePostStatus(@Param('id') id: string, @Body() body: ModeratePublicPostDto) {
    try {
      return await this.publicPostsService.updatePostStatus(id, {
        status: body.status,
        moderationStatus: body.status,
      });
    } catch (error) {
      logEndpointError('PublicPostsController.updatePostStatus', error);
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
  async updateMediaStatus(@Param('id') id: string, @Body() body: ModeratePublicMediaDto) {
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

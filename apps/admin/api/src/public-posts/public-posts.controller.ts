import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
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
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import {
  PublicPostsService,
  UploadedMarketplaceFile,
} from './public-posts.service';
import { ModeratePublicMediaDto } from './dto/moderate-public-media.dto';
import { ModeratePublicPostDto } from './dto/moderate-public-post.dto';

@Controller()
export class PublicPostsController {
  constructor(private readonly publicPostsService: PublicPostsService) {}

  private rethrowHttpException(error: unknown) {
    if (error instanceof HttpException) {
      throw error;
    }
  }

  @Get('public-posts')
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('q') q?: string,
  ) {
    try {
      return await this.publicPostsService.findAll({
        type,
        status,
        visibility,
        q,
      });
    } catch (error) {
      this.rethrowHttpException(error);
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
      return await this.publicPostsService.findAllForAdmin({
        type,
        status,
        visibility,
        q,
      });
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.findAllForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Get('public-posts/me')
  async findMine(@Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.findMine(req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.findMine', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/:id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.publicPostsService.findOne(id, req.user ?? null);
    } catch (error) {
      this.rethrowHttpException(error);
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
      const file = await this.publicPostsService.getMediaAsset(
        mediaId,
        req.user ?? null,
      );
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      );
      return new StreamableFile(file.stream);
    } catch (error) {
      this.rethrowHttpException(error);
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
      const file = await this.publicPostsService.getDocumentAsset(
        documentId,
        req.user ?? null,
      );
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.fileName)}"`,
      );
      return new StreamableFile(file.stream);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.getDocumentAsset', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'public-post-create', maxRequests: 10 })
  @Post('public-posts')
  async create(@Body() body: Record<string, unknown>, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.create(body, req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.create', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Patch('public-posts/:id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.update(id, body, req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.update', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Delete('public-posts/:id')
  async remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.remove(id, req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.remove', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'public-post-upload', maxRequests: 15 })
  @Post('public-posts/:id/media')
  @UseInterceptors(FileInterceptor('file'))
  async addMedia(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMarketplaceFile | undefined,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.addMedia(id, body, file, req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.addMedia', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'public-post-upload', maxRequests: 15 })
  @Post('public-posts/:id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async addDocument(
    @Param('id') id: string,
    @UploadedFile() file: UploadedMarketplaceFile | undefined,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.addDocument(
        id,
        body,
        file,
        req.user,
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.addDocument', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'public-post-link', maxRequests: 20 })
  @Post('public-posts/:id/external-links')
  async addExternalLink(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    try {
      return await this.publicPostsService.addExternalLink(id, body, req.user);
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.addExternalLink', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    key: 'admin-moderation-post',
    maxRequests: 60,
    windowMs: 60_000,
  })
  @Patch('admin/public-posts/:id/status')
  async updatePostStatus(
    @Param('id') id: string,
    @Body() body: ModeratePublicPostDto,
    @Req() req: any,
  ) {
    try {
      return await this.publicPostsService.updatePostStatus(
        id,
        {
          status: body.status,
          moderationStatus: body.moderationStatus,
          visibility: body.visibility,
        },
        req.user,
      );
    } catch (error) {
      this.rethrowHttpException(error);
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
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.listMediaForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/public-post-documents')
  async listDocumentsForAdmin() {
    try {
      return await this.publicPostsService.listDocumentsForAdmin();
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.listDocumentsForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    key: 'admin-moderation-media',
    maxRequests: 60,
    windowMs: 60_000,
  })
  @Patch('admin/public-post-media/:id/status')
  async updateMediaStatus(
    @Param('id') id: string,
    @Body() body: ModeratePublicMediaDto,
    @Req() req: any,
  ) {
    try {
      return await this.publicPostsService.updateMediaStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING',
        req.user,
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.updateMediaStatus', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    key: 'admin-moderation-document',
    maxRequests: 60,
    windowMs: 60_000,
  })
  @Patch('admin/public-post-documents/:id/status')
  async updateDocumentStatus(
    @Param('id') id: string,
    @Body() body: ModeratePublicMediaDto,
    @Req() req: any,
  ) {
    try {
      return await this.publicPostsService.updateDocumentStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING',
        req.user,
      );
    } catch (error) {
      this.rethrowHttpException(error);
      logEndpointError('PublicPostsController.updateDocumentStatus', error);
      return buildInternalErrorResponse(error);
    }
  }
}

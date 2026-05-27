import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permission, PublicModerationStatus } from '@prisma/client';
import type { Response } from 'express';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { UploadProfileDocumentDto } from './dto/upload-profile-document.dto';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfilesService, UploadedProfileFile } from './profiles.service';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(JwtGuard)
  @Get('profile')
  async getCurrentProfile(@Req() req: any) {
    return this.profilesService.getCurrentProfile(req.user);
  }

  @UseGuards(JwtGuard)
  @Put('profile')
  async upsertCurrentProfile(@Body() body: UpsertProfileDto, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.profilesService.upsertCurrentProfile(body, user);
  }

  @Get('profiles/public/:slug')
  async getPublicProfile(@Param('slug') slug: string) {
    return this.profilesService.getPublicProfile(slug);
  }

  @Get('companies/public/:slug')
  async getPublicCompanyProfile(@Param('slug') slug: string) {
    return this.profilesService.getPublicCompanyProfile(slug);
  }

  @UseGuards(JwtGuard)
  @Get('profiles/restricted/:slug')
  async getRestrictedProfile(@Param('slug') slug: string, @Req() req: any) {
    return this.profilesService.getRestrictedProfile(slug, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profiles/:profileId/documents')
  async listDocuments(@Param('profileId') profileId: string, @Req() req: any) {
    return this.profilesService.listDocuments(profileId, req.user);
  }

  @UseGuards(JwtGuard)
  @Post('profiles/:profileId/documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('profileId') profileId: string,
    @UploadedFile() file: UploadedProfileFile | undefined,
    @Body() body: UploadProfileDocumentDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.profilesService.uploadDocument(profileId, body, file, user);
  }

  @UseGuards(JwtGuard)
  @Get('profiles/:profileId/documents/:documentId')
  async getDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.profilesService.getDocument(
      profileId,
      documentId,
      req.user,
    );

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(
        file.fileName,
      )}"`,
    );

    return new StreamableFile(file.stream);
  }

  @Get('profiles/assets/:documentId')
  async getAsset(
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.profilesService.getAsset(documentId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `${file.canPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(
        file.fileName,
      )}"`,
    );

    return new StreamableFile(file.stream);
  }

  @UseGuards(JwtGuard)
  @Get('profiles/:profileId/documents/:documentId/extracted-text')
  async getExtractedText(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    return this.profilesService.getExtractedText(
      profileId,
      documentId,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Post('profiles/:profileId/documents/:documentId/extract')
  async extractDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.profilesService.extractDocument(profileId, documentId, user);
  }

  @UseGuards(JwtGuard, PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Put('profiles/:profileId/documents/:documentId/moderation-status')
  async updateDocumentModerationStatus(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Body() body: { status?: PublicModerationStatus },
    @Req() req: any,
  ) {
    return this.profilesService.updateDocumentModerationStatus(
      profileId,
      documentId,
      body.status,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Delete('profiles/:profileId/documents/:documentId')
  async removeDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.profilesService.removeDocument(profileId, documentId, user);
  }
}

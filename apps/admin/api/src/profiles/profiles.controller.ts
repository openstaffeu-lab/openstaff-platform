import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
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
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProfileWorkerDto } from './dto/create-profile-worker.dto';
import { CreateWorkerDocumentDto } from './dto/create-worker-document.dto';
import { CreateWorkerSkillDto } from './dto/create-worker-skill.dto';
import { UploadProfileDocumentDto } from './dto/upload-profile-document.dto';
import { UpdateProfileWorkerDto } from './dto/update-profile-worker.dto';
import { UpdateWorkerDocumentDto } from './dto/update-worker-document.dto';
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

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Put('profile')
  async upsertCurrentProfile(@Body() body: UpsertProfileDto, @Req() req: any) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.profilesService.upsertCurrentProfile(body, user);
  }

  @UseGuards(JwtGuard)
  @Get('profiles/:profileId/documents')
  async listDocuments(@Param('profileId') profileId: string, @Req() req: any) {
    return this.profilesService.listDocuments(profileId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
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
      throw new UnauthorizedException('Authenticated user not found in request');
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
    const file = await this.profilesService.getDocument(profileId, documentId, req.user);

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
    return this.profilesService.getExtractedText(profileId, documentId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profiles/:profileId/documents/:documentId/extract')
  async extractDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.profilesService.extractDocument(profileId, documentId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Delete('profiles/:profileId/documents/:documentId')
  async removeDocument(
    @Param('profileId') profileId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.profilesService.removeDocument(profileId, documentId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Get('profile/workers')
  async listWorkers(@Req() req: any) {
    return this.profilesService.listWorkers(req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profile/workers')
  async createWorker(@Body() body: CreateProfileWorkerDto, @Req() req: any) {
    return this.profilesService.createWorker(body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Get('profile/workers/:workerId')
  async getWorker(@Param('workerId') workerId: string, @Req() req: any) {
    return this.profilesService.getWorker(workerId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('profile/workers/:workerId')
  async updateWorker(
    @Param('workerId') workerId: string,
    @Body() body: UpdateProfileWorkerDto,
    @Req() req: any,
  ) {
    return this.profilesService.updateWorker(workerId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Delete('profile/workers/:workerId')
  async removeWorker(@Param('workerId') workerId: string, @Req() req: any) {
    return this.profilesService.removeWorker(workerId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Get('profile/workers/:workerId/documents')
  async listWorkerDocuments(@Param('workerId') workerId: string, @Req() req: any) {
    return this.profilesService.listWorkerDocuments(workerId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profile/workers/:workerId/documents')
  async createWorkerDocument(
    @Param('workerId') workerId: string,
    @Body() body: CreateWorkerDocumentDto,
    @Req() req: any,
  ) {
    return this.profilesService.createWorkerDocument(workerId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('profile/workers/:workerId/documents/:documentId')
  async updateWorkerDocument(
    @Param('workerId') workerId: string,
    @Param('documentId') documentId: string,
    @Body() body: UpdateWorkerDocumentDto,
    @Req() req: any,
  ) {
    return this.profilesService.updateWorkerDocument(workerId, documentId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Get('profile/workers/:workerId/skills')
  async listWorkerSkills(@Param('workerId') workerId: string, @Req() req: any) {
    return this.profilesService.listWorkerSkills(workerId, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profile/workers/:workerId/skills')
  async createWorkerSkill(
    @Param('workerId') workerId: string,
    @Body() body: CreateWorkerSkillDto,
    @Req() req: any,
  ) {
    return this.profilesService.createWorkerSkill(workerId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Delete('profile/workers/:workerId/skills/:skillId')
  async removeWorkerSkill(
    @Param('workerId') workerId: string,
    @Param('skillId') skillId: string,
    @Req() req: any,
  ) {
    return this.profilesService.removeWorkerSkill(workerId, skillId, req.user);
  }
}

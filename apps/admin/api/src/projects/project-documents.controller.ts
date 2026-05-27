import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateProjectDocumentDto } from './dto/create-project-document.dto';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';
import {
  ProjectDocumentsService,
  UploadedProjectFile,
} from './project-documents.service';

@Controller('projects/:projectId/documents')
export class ProjectDocumentsController {
  constructor(
    private readonly projectDocumentsService: ProjectDocumentsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get()
  async findAll(@Param('projectId') projectId: string, @Req() req: any) {
    return this.projectDocumentsService.findAll(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get(':documentId/extracted-text')
  async getExtractedText(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    return this.projectDocumentsService.getExtractedText(
      projectId,
      documentId,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Get(':documentId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.projectDocumentsService.findOne(
      projectId,
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

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() body: CreateProjectDocumentDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDocumentsService.create(projectId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('projectId') projectId: string,
    @UploadedFile() file: UploadedProjectFile | undefined,
    @Body() body: UploadProjectDocumentDto,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDocumentsService.upload(projectId, body, file, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Post(':documentId/extract')
  async extract(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDocumentsService.extract(projectId, documentId, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR']),
  )
  @Delete(':documentId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const user = req.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException(
        'Authenticated user not found in request',
      );
    }

    return this.projectDocumentsService.remove(projectId, documentId, user);
  }
}

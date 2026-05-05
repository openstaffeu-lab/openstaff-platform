import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentActor } from '../auth/current-actor.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Body() body: UploadDocumentDto,
    @UploadedFile() file: any,
    @CurrentActor() actor: any,
  ) {
    return this.documentsService.upload(body, file, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':actorId')
  listByActor(@Param('actorId') actorId: string, @CurrentActor() actor: any) {
    return this.documentsService.listByActor(actorId, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.documentsService.verifyDocument(id, actor);
  }
}

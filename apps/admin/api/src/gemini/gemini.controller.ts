import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; history?: any[]; actorId?: string }) {
    return this.geminiService.chat(body.message, body.history || [], body.actorId);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.COMPLIANCE_OFFICER)
  @Post('analyze-document')
  async analyzeDocument(@Body() body: { fileUrl: string; documentType: string }) {
    return this.geminiService.analyzeDocument(body.fileUrl, body.documentType);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('generate-contract')
  async generateContract(@Body() body: { contractId: string }) {
    return this.geminiService.generateContract(body.contractId);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.COMPLIANCE_OFFICER)
  @Post('compliance-check')
  async complianceCheck(@Body() body: { content: string }) {
    return this.geminiService.complianceCheck(body.content);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('pcb-assist')
  async pcbAssist(@Body() body: { prompt: string; context?: string }) {
    return this.geminiService.pcbAssist(body.prompt, body.context);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Get('agents')
  async getAgents() {
    return this.geminiService.listAgents();
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.SUPERADMIN)
  @Patch('agents/:id')
  async updateAgent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.geminiService.updateAgent(id, body);
  }
}

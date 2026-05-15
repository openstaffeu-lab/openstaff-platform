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
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { ComplianceEligibilityService } from './compliance-eligibility.service';
import { ComplianceRequestsService } from './compliance-requests.service';
import { ComplianceService } from './compliance.service';
import { CreateActorCertificationDto } from './dto/create-actor-certification.dto';
import { CreateActorDocumentDto } from './dto/create-actor-document.dto';
import { CreateMedicalFitnessCertificateDto } from './dto/create-medical-fitness-certificate.dto';
import { UpdateActorCertificationDto } from './dto/update-actor-certification.dto';
import { UpdateActorDocumentDto } from './dto/update-actor-document.dto';
import { UpdateMedicalFitnessCertificateDto } from './dto/update-medical-fitness-certificate.dto';
import { UpdateUserTaskStatusDto } from './dto/update-user-task-status.dto';

@Controller()
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly complianceEligibilityService: ComplianceEligibilityService,
    private readonly complianceRequestsService: ComplianceRequestsService,
  ) {}

  @UseGuards(JwtGuard)
  @Get('profile/compliance')
  async getCurrentProfileCompliance(@Req() req: any) {
    return this.complianceService.getCurrentProfileCompliance(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile/eligibility')
  async getCurrentProfileEligibility(@Req() req: any) {
    return this.complianceEligibilityService.getCurrentProfileEligibility(req.user);
  }

  @UseGuards(JwtGuard)
  @Post('profile/compliance/recompute')
  async recomputeCurrentProfileCompliance(@Req() req: any) {
    return this.complianceService.recomputeCurrentProfileCompliance(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile/tasks')
  async listCurrentUserTasks(@Req() req: any) {
    return this.complianceService.listCurrentUserTasks(req.user);
  }

  @UseGuards(JwtGuard)
  @Get('profile/alerts')
  async listCurrentUserAlerts(@Req() req: any) {
    return this.complianceService.listCurrentUserAlerts(req.user);
  }

  @UseGuards(JwtGuard)
  @Patch('profile/tasks/:taskId/status')
  async updateCurrentUserTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateUserTaskStatusDto,
    @Req() req: any,
  ) {
    return this.complianceService.updateCurrentUserTask(taskId, body, req.user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profiles/:profileId/actor-documents')
  async createActorDocument(
    @Param('profileId') profileId: string,
    @Body() body: CreateActorDocumentDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.createActorDocument(profileId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('profiles/:profileId/actor-documents/:actorDocumentId')
  async updateActorDocument(
    @Param('profileId') profileId: string,
    @Param('actorDocumentId') actorDocumentId: string,
    @Body() body: UpdateActorDocumentDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.updateActorDocument(profileId, actorDocumentId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profiles/:profileId/certifications')
  async createCertification(
    @Param('profileId') profileId: string,
    @Body() body: CreateActorCertificationDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.createCertification(profileId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('profiles/:profileId/certifications/:certificationId')
  async updateCertification(
    @Param('profileId') profileId: string,
    @Param('certificationId') certificationId: string,
    @Body() body: UpdateActorCertificationDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.updateCertification(profileId, certificationId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Post('profiles/:profileId/medical-fitness')
  async createMedicalFitnessCertificate(
    @Param('profileId') profileId: string,
    @Body() body: CreateMedicalFitnessCertificateDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.createMedicalFitnessCertificate(profileId, body, user);
  }

  @UseGuards(
    JwtGuard,
    new RolesGuard(['ADMIN', 'EMPLOYER', 'CONTRACTOR', 'GENERAL_CONTRACTOR', 'PROFESSIONAL']),
  )
  @Patch('profiles/:profileId/medical-fitness/:medicalFitnessCertificateId')
  async updateMedicalFitnessCertificate(
    @Param('profileId') profileId: string,
    @Param('medicalFitnessCertificateId') medicalFitnessCertificateId: string,
    @Body() body: UpdateMedicalFitnessCertificateDto,
    @Req() req: any,
  ) {
    const user = req.user;
    if (!user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    return this.complianceService.updateMedicalFitnessCertificate(
      profileId,
      medicalFitnessCertificateId,
      body,
      user,
    );
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/compliance')
  async getProjectComplianceOverview(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.complianceService.getProjectComplianceOverview(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/eligibility')
  async getProjectEligibility(@Param('projectId') projectId: string, @Req() req: any) {
    return this.complianceEligibilityService.getProjectEligibility(projectId, req.user);
  }

  @UseGuards(JwtGuard)
  @Get('projects/:projectId/job-requests/:jobRequestId/eligibility')
  async getJobRequestEligibility(
    @Param('projectId') projectId: string,
    @Param('jobRequestId') jobRequestId: string,
    @Req() req: any,
  ) {
    return this.complianceEligibilityService.getJobRequestEligibility(
      projectId,
      jobRequestId,
      req.user,
    );
  }

  @UseGuards(JwtGuard)
  @Post('compliance/export-request')
  async createExportRequest(@Req() req: any) {
    return this.complianceRequestsService.createExportRequest(req.user, req);
  }

  @UseGuards(JwtGuard)
  @Post('compliance/delete-request')
  async createDeleteRequest(@Req() req: any) {
    return this.complianceRequestsService.createDeleteRequest(req.user, req);
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/compliance/requests')
  async listAdminComplianceRequests(@Req() req: any) {
    return this.complianceRequestsService.listAdminRequests(req.user);
  }
}

import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { JwtGuard } from '../auth/jwt.guard';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationModule } from '../notifications/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialRulesService } from './financial-rules.service';
import { MatchEngineService } from './match-engine.service';
import { ProjectAIInterpretationsController } from './project-ai-interpretations.controller';
import { ProjectAIInterpretationsService } from './project-ai-interpretations.service';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectAIParserService } from './project-ai-parser.service';
import { ProjectConditionsController } from './project-conditions.controller';
import { ProjectConditionsService } from './project-conditions.service';
import { ProjectContractsController } from './project-contracts.controller';
import { ProjectContractsService } from './project-contracts.service';
import { ProjectDisputesController } from './project-disputes.controller';
import { ProjectDisputesService } from './project-disputes.service';
import { ProjectDocumentsController } from './project-documents.controller';
import { ProjectDocumentsService } from './project-documents.service';
import { ProjectExecutionController } from './project-execution.controller';
import { ProjectExecutionService } from './project-execution.service';
import { ProjectInvitationsController } from './project-invitations.controller';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectJobRequestsController } from './project-job-requests.controller';
import { ProjectJobRequestsService } from './project-job-requests.service';
import { ProjectMatchesController } from './project-matches.controller';
import { ProjectPaymentsController } from './project-payments.controller';
import { ProjectProposalsController } from './project-proposals.controller';
import { ProjectProposalsService } from './project-proposals.service';
import { ProjectResponseMapper } from './project-response.mapper';
import { ProjectShortlistController } from './project-shortlist.controller';
import { ProjectShortlistService } from './project-shortlist.service';
import { ProjectTimesheetsController } from './project-timesheets.controller';
import { ProjectTimesheetsService } from './project-timesheets.service';
import { ProjectWorkerAssignmentsController } from './project-worker-assignments.controller';
import { ProjectWorkerAssignmentsService } from './project-worker-assignments.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessControlModule,
    ComplianceModule,
    AuditModule,
    NotificationModule,
    MessagingModule,
  ],
  controllers: [
    ProjectsController,
    ProjectJobRequestsController,
    ProjectConditionsController,
    ProjectAIInterpretationsController,
    ProjectDocumentsController,
    ProjectExecutionController,
    ProjectDisputesController,
    ProjectMatchesController,
    ProjectShortlistController,
    ProjectInvitationsController,
    ProjectProposalsController,
    ProjectContractsController,
    ProjectPaymentsController,
    ProjectTimesheetsController,
    ProjectWorkerAssignmentsController,
  ],
  providers: [
    ProjectsService,
    ProjectJobRequestsService,
    ProjectConditionsService,
    ProjectAIInterpretationsService,
    ProjectDocumentsService,
    ProjectExecutionService,
    ProjectDisputesService,
    ProjectAIParserService,
    FinancialRulesService,
    MatchEngineService,
    ProjectShortlistService,
    ProjectInvitationsService,
    ProjectProposalsService,
    ProjectContractsService,
    ProjectTimesheetsService,
    ProjectWorkerAssignmentsService,
    ProjectAccessPolicy,
    ProjectResponseMapper,
    JwtGuard,
  ],
})
export class ProjectsModule {}

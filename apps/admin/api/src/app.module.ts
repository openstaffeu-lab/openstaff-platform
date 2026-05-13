import { Module } from '@nestjs/common';
import { AccessControlModule } from './access-control/access-control.module';
import { ActorsModule } from './actors/actors.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CountriesModule } from './countries/countries.module';
import { DocumentsModule } from './documents/documents.module';
import { EscoModule } from './esco/esco.module';
import { ExternalLinksModule } from './external-links/external-links.module';
import { GeminiModule } from './gemini/gemini.module';
import { JobsModule } from './jobs/jobs.module';
import { NaceModule } from './nace/nace.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrivateMessagingModule } from './private-messaging/private-messaging.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ProjectsModule } from './projects/projects.module';
import { PublicFeedbackModule } from './public-feedback/public-feedback.module';
import { PublicPostsModule } from './public-posts/public-posts.module';
import { ReluModule } from './relu/relu.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { UiConfigModule } from './ui-config/ui-config.module';
import { UniclassModule } from './uniclass/uniclass.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessControlModule,
    AuditModule,
    ActorsModule,
    JobsModule,
    DocumentsModule,
    GeminiModule,
    ReluModule,
    ProjectsModule,
    ProfilesModule,
    CountriesModule,
    EscoModule,
    NaceModule,
    UniclassModule,
    UiConfigModule,
    SubscriptionsModule,
    TaxonomyModule,
    PublicPostsModule,
    ExternalLinksModule,
    PrivateMessagingModule,
    PublicFeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

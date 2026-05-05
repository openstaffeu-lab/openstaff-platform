import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { CountriesModule } from './countries/countries.module';
import { EscoModule } from './esco/esco.module';
import { NaceModule } from './nace/nace.module';
import { UniclassModule } from './uniclass/uniclass.module';

@Module({
  imports: [
    ProjectsModule,
    ContractsModule,
    CountriesModule,
    EscoModule,
    NaceModule,
    UniclassModule,
  ],
})
export class AppModule {}

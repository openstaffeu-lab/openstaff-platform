import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prismaMock = createPrismaServiceMock();

  beforeEach(async () => {
    const module = await createTestingModule({
      providers: [ProjectsService, ProjectAccessPolicy, ProjectResponseMapper],
      extraProviders: [{ provide: PrismaService, useValue: prismaMock }],
    });

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

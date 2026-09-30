import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createPrismaServiceMock,
  createTestingModule,
} from '../test/testing-module.factory';
import { ProjectAccessPolicy } from './project-access.policy';
import { ProjectResponseMapper } from './project-response.mapper';
import { ProjectWriteEvidenceAdapter } from './project-write-evidence.adapter';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prismaMock = createPrismaServiceMock();
  const projectWriteEvidenceMock = {
    recordProjectCreated: jest.fn(),
    recordProjectUpdated: jest.fn(),
  };
  const projectResponseMapperMock = {
    toProjectListItem: jest.fn((project) => project),
    toProjectDetail: jest.fn((project) => project),
  };

  const request = {
    headers: {
      'x-request-id': 'req-1',
      'user-agent': 'jest',
    },
    ip: '127.0.0.1',
  };

  const project = {
    id: 'project-1',
    slug: 'test-project',
    name: 'Test project',
    createdById: 'user-1',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    engagementModel: 'MIXED',
    publishedAt: null,
    archivedAt: null,
    description: 'sensitive description',
    scopeOfWork: 'sensitive scope',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.project.findUnique.mockReset();
    prismaMock.project.create.mockReset();
    prismaMock.project.update.mockReset();
    projectResponseMapperMock.toProjectListItem.mockImplementation(
      (project) => project,
    );
    projectResponseMapperMock.toProjectDetail.mockImplementation(
      (project) => project,
    );

    const module = await createTestingModule({
      providers: [ProjectsService, ProjectAccessPolicy],
      extraProviders: [
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ProjectResponseMapper,
          useValue: projectResponseMapperMock,
        },
        {
          provide: ProjectWriteEvidenceAdapter,
          useValue: projectWriteEvidenceMock,
        },
      ],
    });

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records one Project creation evidence attempt after create', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prismaMock.project.findUnique.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue(project);

    const result = await service.create(
      {
        name: 'Test project',
        description: 'sensitive description',
        scopeOfWork: 'sensitive scope',
        documents: [
          {
            title: 'Sensitive file',
            fileName: 'secret.pdf',
            storageKey: 'secret/storage/key',
          },
        ],
        aiInterpretation: {
          sourceText: 'sensitive ai input',
          extractedJson: { unsafe: true },
        },
      } as any,
      { sub: 'user-1', role: 'EMPLOYER' },
      request,
    );

    expect(result).toBe(project);
    expect(projectWriteEvidenceMock.recordProjectCreated).toHaveBeenCalledTimes(
      1,
    );
    expect(projectWriteEvidenceMock.recordProjectCreated).toHaveBeenCalledWith({
      project,
      actor: { sub: 'user-1', role: 'EMPLOYER' },
      request,
    });
    expect(
      projectWriteEvidenceMock.recordProjectUpdated,
    ).not.toHaveBeenCalled();
  });

  it('records one Project update evidence attempt after authorized update', async () => {
    const updatedProject = {
      ...project,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      publishedAt: new Date('2026-08-20T10:00:00.000Z'),
    };

    prismaMock.project.findUnique
      .mockResolvedValueOnce(project)
      .mockResolvedValueOnce(null);
    prismaMock.project.update.mockResolvedValue(updatedProject);

    const result = await service.update(
      'project-1',
      {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      } as any,
      { sub: 'user-1', role: 'EMPLOYER' },
      request,
    );

    expect(result).toBe(updatedProject);
    expect(projectWriteEvidenceMock.recordProjectUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(projectWriteEvidenceMock.recordProjectUpdated).toHaveBeenCalledWith({
      beforeProject: project,
      afterProject: updatedProject,
      actor: { sub: 'user-1', role: 'EMPLOYER' },
      request,
    });
    expect(
      projectWriteEvidenceMock.recordProjectCreated,
    ).not.toHaveBeenCalled();
  });

  it('does not record FIU-1 evidence for rejected non-owner updates', async () => {
    prismaMock.project.findUnique.mockResolvedValue(project);

    await expect(
      service.update(
        'project-1',
        { status: 'PUBLISHED' } as any,
        { sub: 'other-user', role: 'EMPLOYER' },
        request,
      ),
    ).rejects.toThrow('You do not have access to modify this project');

    expect(prismaMock.project.update).not.toHaveBeenCalled();
    expect(
      projectWriteEvidenceMock.recordProjectUpdated,
    ).not.toHaveBeenCalled();
    expect(
      projectWriteEvidenceMock.recordProjectCreated,
    ).not.toHaveBeenCalled();
  });

  it('preserves Project create success when evidence logging fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prismaMock.project.findUnique.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue(project);
    projectWriteEvidenceMock.recordProjectCreated.mockResolvedValue(undefined);

    await expect(
      service.create(
        { name: 'Test project' } as any,
        { sub: 'user-1', role: 'EMPLOYER' },
        request,
      ),
    ).resolves.toBe(project);
  });
});

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { createTestingModule } from '../test/testing-module.factory';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  const projectsServiceMock = {
    findAll: jest.fn().mockResolvedValue({ items: [] }),
    findOne: jest.fn().mockResolvedValue({ id: 'project-1' }),
    create: jest.fn().mockResolvedValue({ id: 'project-1' }),
    update: jest.fn().mockResolvedValue({ id: 'project-1' }),
  };

  beforeEach(async () => {
    const module = await createTestingModule({
      controllers: [ProjectsController],
      extraProviders: [
        { provide: ProjectsService, useValue: projectsServiceMock },
      ],
    });

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes request context through Project creation without changing response', async () => {
    const req = {
      user: { sub: 'user-1', role: 'EMPLOYER' },
      headers: { 'x-request-id': 'req-1' },
    };

    const result = await controller.create({ name: 'Project' } as any, req);

    expect(result).toEqual({ id: 'project-1' });
    expect(projectsServiceMock.create).toHaveBeenCalledWith(
      { name: 'Project' },
      req.user,
      req,
    );
  });

  it('passes request context through Project update without changing response', async () => {
    const req = {
      user: { sub: 'user-1', role: 'EMPLOYER' },
      headers: { 'x-request-id': 'req-1' },
    };

    const result = await controller.update(
      'project-1',
      { status: 'PUBLISHED' } as any,
      req,
    );

    expect(result).toEqual({ id: 'project-1' });
    expect(projectsServiceMock.update).toHaveBeenCalledWith(
      'project-1',
      { status: 'PUBLISHED' },
      req.user,
      req,
    );
  });
});

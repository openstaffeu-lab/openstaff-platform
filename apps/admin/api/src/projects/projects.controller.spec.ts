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
});

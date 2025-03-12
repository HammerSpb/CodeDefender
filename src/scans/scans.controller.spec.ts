import { Test, TestingModule } from '@nestjs/testing';
import { ScansController } from './scans.controller';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { ScanStatus, UserRole } from '@prisma/client';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('ScansController', () => {
  let controller: ScansController;
  let service: ScansService;

  // Test data setup
  const mockDate = new Date();
  const mockUser = {
    id: 'user-id',
    sub: 'user-id',
    email: 'test@example.com',
    role: UserRole.OWNER,
    mfaSecret: null,
    mfaEnabled: false,
  };

  const mockScan = {
    id: 'scan-id',
    repositoryId: 'repo-id',
    workspaceId: 'workspace-id',
    branch: 'main',
    status: ScanStatus.QUEUED,
    historical: false,
    fileExclusions: [],
    results: null,
    createdAt: mockDate,
    updatedAt: mockDate,
    completedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScansController],
      providers: [
        {
          provide: ScansService,
          useValue: {
            create: jest.fn(),
            findAllByWorkspace: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ScansController>(ScansController);
    service = module.get<ScansService>(ScansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const workspaceId = 'workspace-id';
    const createDto: CreateScanDto = {
      repositoryId: 'repo-id',
      branch: 'main',
      workspaceId: 'other-workspace-id', // Should be overridden
      historical: false,
      fileExclusions: [],
    };
    const req = { user: mockUser };

    it('should create a new scan', async () => {
      // Arrange
      jest.spyOn(service, 'create').mockResolvedValue(mockScan);

      // Act
      const result = await controller.create(workspaceId, createDto, req);

      // Assert
      expect(createDto.workspaceId).toBe(workspaceId); // Should be overridden by the controller
      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.sub);
      expect(result).toEqual(mockScan);
    });
  });

  describe('findAll', () => {
    const workspaceId = 'workspace-id';
    const req = { user: mockUser };

    it('should return all scans for a workspace', async () => {
      // Arrange
      const scans = [mockScan];
      jest.spyOn(service, 'findAllByWorkspace').mockResolvedValue(scans);

      // Act
      const result = await controller.findAll(workspaceId, req);

      // Assert
      expect(service.findAllByWorkspace).toHaveBeenCalledWith(workspaceId, mockUser.sub);
      expect(result).toEqual(scans);
    });
  });

  describe('findOne', () => {
    const scanId = mockScan.id;
    const req = { user: mockUser };

    it('should return a scan by ID', async () => {
      // Arrange
      jest.spyOn(service, 'findOne').mockResolvedValue(mockScan);

      // Act
      const result = await controller.findOne(scanId, req);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(scanId, mockUser.sub);
      expect(result).toEqual(mockScan);
    });
  });

  describe('remove', () => {
    const scanId = mockScan.id;
    const req = { user: mockUser };

    it('should delete a scan', async () => {
      // Arrange
      jest.spyOn(service, 'remove').mockResolvedValue(mockScan);

      // Act
      const result = await controller.remove(scanId, req);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(scanId, mockUser.sub);
      expect(result).toEqual(mockScan);
    });
  });
});

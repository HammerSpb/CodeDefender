import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionGuard } from './permission.guard';
import { PermissionsService } from '../permissions.service';
import { PERMISSION_KEY } from '../decorators/requires-permission.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let permissionsService: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            userHasPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    const mockRequest = {
      user: {
        id: 'user-id',
      },
      params: {
        workspace_id: 'workspace-id',
      },
    };

    beforeEach(() => {
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should allow access if no permission required', async () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSION_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should throw ForbiddenException if user not authenticated', async () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('SCAN:VIEW');
      const mockContextNoUser = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContextNoUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSION_KEY, [
        mockContextNoUser.getHandler(),
        mockContextNoUser.getClass(),
      ]);
    });

    it('should allow access if user has required permission', async () => {
      // Arrange
      const permission = 'SCAN:VIEW';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permission);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(permissionsService.userHasPermission).toHaveBeenCalledWith(
        mockRequest.user.id,
        permission,
        mockRequest.params.workspace_id,
      );
    });

    it('should throw ForbiddenException if user does not have required permission', async () => {
      // Arrange
      const permission = 'SCAN:VIEW';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permission);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(false);

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
      expect(permissionsService.userHasPermission).toHaveBeenCalledWith(
        mockRequest.user.id,
        permission,
        mockRequest.params.workspace_id,
      );
    });

    it('should use workspaceId from params.workspaceId if available', async () => {
      // Arrange
      const permission = 'SCAN:VIEW';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permission);
      jest.spyOn(permissionsService, 'userHasPermission').mockResolvedValue(true);
      
      const mockRequestWithWorkspaceId = {
        user: {
          id: 'user-id',
        },
        params: {
          workspaceId: 'workspace-id-alt',
        },
      };
      
      const mockContextWithWorkspaceId = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequestWithWorkspaceId),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      // Act
      const result = await guard.canActivate(mockContextWithWorkspaceId);

      // Assert
      expect(result).toBe(true);
      expect(permissionsService.userHasPermission).toHaveBeenCalledWith(
        mockRequestWithWorkspaceId.user.id,
        permission,
        mockRequestWithWorkspaceId.params.workspaceId,
      );
    });
  });
});

# Adding New Features

This guide provides a step-by-step process for adding new features to CodeDefender.

## Feature Development Process

### 1. Requirements Analysis

Before writing any code:

1. Clearly define the feature requirements
2. Identify affected components and potential impacts
3. Determine permission requirements and plan-based restrictions
4. Create a technical design document for complex features

### 2. Implementation Planning

For each feature, determine:

1. Which modules need to be created or modified
2. Database schema changes (if any)
3. New API endpoints required
4. Authorization requirements
5. Testing strategy

### 3. Implementation Checklist

#### Database Changes

If your feature requires database changes:

1. Update the Prisma schema (`prisma/schema.prisma`)
2. Create a migration:
   ```bash
   pnpm prisma:migrate
   ```
3. Update seed data if necessary
4. Update related services to use the new schema

#### Permission System Integration

If your feature requires new permissions:

1. Add new permission codes to `src/permissions/constants/permission-codes.ts`:
   ```typescript
   // Add to PERMISSION_CODES
   FEATURE_ACTION: createPermissionCode(PermissionResource.FEATURE, PermissionAction.ACTION),
   
   // Add to PERMISSION_DESCRIPTIONS
   [PERMISSION_CODES.FEATURE_ACTION]: 'Description of the permission',
   ```

2. Add permission seeds to `prisma/seeds/permissions-seed.ts`
3. Update role permissions in `prisma/seeds/roles-seed.ts`

#### Plan Feature Integration

If the feature is limited by subscription plan:

1. Add feature flag to `src/plans/constants/plan-features.ts`:
   ```typescript
   // Add to Feature enum
   export enum Feature {
     // Existing features...
     NEW_FEATURE = 'hasNewFeature',
   }
   
   // Add to PLAN_FEATURES
   export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
     [Plan.STARTER]: {
       // Existing features...
       hasNewFeature: false,
     },
     [Plan.PRO]: {
       // Existing features...
       hasNewFeature: true,
     },
     // Other plans...
   };
   
   // Add to PLAN_UPGRADE_MESSAGES
   export const PLAN_UPGRADE_MESSAGES = {
     // Existing messages...
     [Feature.NEW_FEATURE]: 'Upgrade to Pro plan or higher to access this feature.',
   };
   ```

2. Use the feature guard in your controller:
   ```typescript
   @RequiresFeature(Feature.NEW_FEATURE)
   method() {
     // Implementation
   }
   ```

### 4. Creating New Module

For a completely new feature, create a new module structure:

1. Create the module directory:
   ```bash
   mkdir -p src/feature-name/{dto,constants,guards,interfaces}
   ```

2. Create the module file:
   ```typescript
   // src/feature-name/feature-name.module.ts
   import { Module } from '@nestjs/common';
   import { FeatureNameService } from './feature-name.service';
   import { FeatureNameController } from './feature-name.controller';
   import { PrismaModule } from '../prisma/prisma.module';
   import { PermissionsModule } from '../permissions/permissions.module';
   
   @Module({
     imports: [PrismaModule, PermissionsModule],
     controllers: [FeatureNameController],
     providers: [FeatureNameService],
     exports: [FeatureNameService],
   })
   export class FeatureNameModule {}
   ```

3. Create the controller file:
   ```typescript
   // src/feature-name/feature-name.controller.ts
   import { Controller, Get, Post, Body, Param, Delete, Put, Query, Request } from '@nestjs/common';
   import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
   import { FeatureNameService } from './feature-name.service';
   import { CreateFeatureDto } from './dto/create-feature.dto';
   import { UpdateFeatureDto } from './dto/update-feature.dto';
   import { RequiresPermission } from '../permissions/decorators/requires-permission.decorator';
   import { PERMISSION_CODES } from '../permissions/constants/permission-codes';
   
   @ApiTags('feature-name')
   @Controller('feature-name')
   @ApiBearerAuth()
   export class FeatureNameController {
     constructor(private readonly featureNameService: FeatureNameService) {}
   
     @Post()
     @RequiresPermission(PERMISSION_CODES.FEATURE_CREATE)
     @ApiOperation({ summary: 'Create new feature' })
     @ApiResponse({ status: 201, description: 'Feature created successfully' })
     create(@Body() createFeatureDto: CreateFeatureDto, @Request() req) {
       return this.featureNameService.create(createFeatureDto, req.user.sub);
     }
   
     @Get()
     @RequiresPermission(PERMISSION_CODES.FEATURE_READ)
     @ApiOperation({ summary: 'Get all features' })
     findAll(@Request() req) {
       return this.featureNameService.findAll(req.user.sub);
     }
   
     @Get(':id')
     @RequiresPermission(PERMISSION_CODES.FEATURE_READ)
     @ApiOperation({ summary: 'Get feature by id' })
     findOne(@Param('id') id: string, @Request() req) {
       return this.featureNameService.findOne(id, req.user.sub);
     }
   
     @Put(':id')
     @RequiresPermission(PERMISSION_CODES.FEATURE_UPDATE)
     @ApiOperation({ summary: 'Update feature' })
     update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto, @Request() req) {
       return this.featureNameService.update(id, updateFeatureDto, req.user.sub);
     }
   
     @Delete(':id')
     @RequiresPermission(PERMISSION_CODES.FEATURE_DELETE)
     @ApiOperation({ summary: 'Delete feature' })
     remove(@Param('id') id: string, @Request() req) {
       return this.featureNameService.remove(id, req.user.sub);
     }
   }
   ```

4. Create the service file:
   ```typescript
   // src/feature-name/feature-name.service.ts
   import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { CreateFeatureDto } from './dto/create-feature.dto';
   import { UpdateFeatureDto } from './dto/update-feature.dto';
   import { PermissionsService } from '../permissions/permissions.service';
   import { PERMISSION_CODES } from '../permissions/constants/permission-codes';
   
   @Injectable()
   export class FeatureNameService {
     constructor(
       private prisma: PrismaService,
       private permissionsService: PermissionsService,
     ) {}
   
     async create(createFeatureDto: CreateFeatureDto, userId: string) {
       // Implementation
     }
   
     async findAll(userId: string) {
       // Implementation
     }
   
     async findOne(id: string, userId: string) {
       // Implementation
     }
   
     async update(id: string, updateFeatureDto: UpdateFeatureDto, userId: string) {
       // Implementation
     }
   
     async remove(id: string, userId: string) {
       // Implementation
     }
   }
   ```

5. Create DTO files:
   ```typescript
   // src/feature-name/dto/create-feature.dto.ts
   import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
   import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
   
   export class CreateFeatureDto {
     @ApiProperty({ description: 'Feature name' })
     @IsString()
     @IsNotEmpty()
     name: string;
   
     @ApiPropertyOptional({ description: 'Feature description' })
     @IsString()
     @IsOptional()
     description?: string;
   
     @ApiProperty({ description: 'Associated workspace ID' })
     @IsUUID()
     @IsNotEmpty()
     workspaceId: string;
   }
   
   // src/feature-name/dto/update-feature.dto.ts
   import { PartialType } from '@nestjs/swagger';
   import { CreateFeatureDto } from './create-feature.dto';
   
   export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
   ```

6. Add the module to the app module:
   ```typescript
   // src/app.module.ts
   import { FeatureNameModule } from './feature-name/feature-name.module';
   
   @Module({
     imports: [
       // Existing modules...
       FeatureNameModule,
     ],
   })
   export class AppModule {}
   ```

### 5. Authorization Integration

Implement proper authorization:

1. **Basic Permission Checks**:
   ```typescript
   @RequiresPermission(PERMISSION_CODES.FEATURE_READ)
   method() {
     // Implementation
   }
   ```

2. **Multiple Permission Checks**:
   ```typescript
   @RequiresAllPermissions([
     PERMISSION_CODES.FEATURE_READ, 
     PERMISSION_CODES.WORKSPACE_READ
   ])
   method() {
     // Implementation
   }
   ```

3. **Advanced Authorization**:
   ```typescript
   @Authorize({
     permissions: [PERMISSION_CODES.FEATURE_READ],
     features: [Feature.SOME_FEATURE],
     checkWorkspaceMembership: true,
   })
   method() {
     // Implementation
   }
   ```

### 6. Testing the Feature

1. **Unit Tests**:
   Create unit tests for service methods:
   ```typescript
   // src/feature-name/feature-name.service.spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { FeatureNameService } from './feature-name.service';
   import { PrismaService } from '../prisma/prisma.service';
   import { PermissionsService } from '../permissions/permissions.service';
   import { mockDeep } from 'jest-mock-extended';
   
   describe('FeatureNameService', () => {
     let service: FeatureNameService;
     let prisma: PrismaService;
     let permissionsService: PermissionsService;
   
     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           FeatureNameService,
           {
             provide: PrismaService,
             useValue: mockDeep<PrismaService>(),
           },
           {
             provide: PermissionsService,
             useValue: mockDeep<PermissionsService>(),
           },
         ],
       }).compile();
   
       service = module.get<FeatureNameService>(FeatureNameService);
       prisma = module.get<PrismaService>(PrismaService);
       permissionsService = module.get<PermissionsService>(PermissionsService);
     });
   
     it('should be defined', () => {
       expect(service).toBeDefined();
     });
   
     describe('create', () => {
       it('should create a new feature', async () => {
         // Test implementation
       });
     });
   
     // Additional test cases
   });
   ```

2. **Integration Tests**:
   Create integration tests for API endpoints:
   ```typescript
   // test/feature-name.e2e-spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication, ValidationPipe } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { PrismaService } from '../src/prisma/prisma.service';
   import { AuthService } from '../src/auth/auth.service';
   
   describe('FeatureNameController (e2e)', () => {
     let app: INestApplication;
     let prisma: PrismaService;
     let authService: AuthService;
     let authToken: string;
   
     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       }).compile();
   
       app = moduleFixture.createNestApplication();
       app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
   
       prisma = app.get<PrismaService>(PrismaService);
       authService = app.get<AuthService>(AuthService);
   
       await app.init();
   
       // Get authentication token
       // ...
     });
   
     afterAll(async () => {
       await app.close();
     });
   
     it('/feature-name (POST)', () => {
       return request(app.getHttpServer())
         .post('/feature-name')
         .set('Authorization', `Bearer ${authToken}`)
         .send({
           name: 'Test Feature',
           description: 'Test Description',
           workspaceId: 'workspace-id',
         })
         .expect(201)
         .then(response => {
           expect(response.body.data).toHaveProperty('id');
           expect(response.body.data.name).toBe('Test Feature');
         });
     });
   
     // Additional test cases
   });
   ```

### 7. Documentation

1. **API Documentation**:
   Add Swagger annotations to controllers and DTOs:
   ```typescript
   @ApiTags('feature-name')
   @Controller('feature-name')
   @ApiBearerAuth()
   export class FeatureNameController {
     // ...
   }
   ```

2. **Feature Documentation**:
   Create a documentation file:
   ```markdown
   # Feature Name
   
   This document describes the feature and its implementation.
   
   ## Overview
   
   Description of the feature and its purpose.
   
   ## API Endpoints
   
   - `POST /feature-name` - Create a new feature
   - `GET /feature-name` - List all features
   - `GET /feature-name/:id` - Get a specific feature
   - `PUT /feature-name/:id` - Update a feature
   - `DELETE /feature-name/:id` - Delete a feature
   
   ## Authorization
   
   - Required permissions
   - Plan-based restrictions
   
   ## Implementation Details
   
   Technical details about the implementation.
   ```

### 8. Final Checklist

Before submitting your PR:

- [ ] All required files are created or modified
- [ ] Database migrations are created and tested
- [ ] Permission codes are properly integrated
- [ ] Plan-based restrictions are implemented if needed
- [ ] All API endpoints are properly documented
- [ ] Unit tests are written and passing
- [ ] Integration tests are written and passing
- [ ] Feature documentation is complete
- [ ] Code follows project coding standards
- [ ] No unnecessary console logs or debug code

## Example: Adding a New Notification Feature

Let's walk through adding a notification feature:

1. **Database Changes**:
   ```prisma
   // prisma/schema.prisma
   model Notification {
     id          String    @id @default(uuid())
     userId      String    @map("user_id")
     title       String
     message     String
     isRead      Boolean   @default(false) @map("is_read")
     type        String
     createdAt   DateTime  @default(now()) @map("created_at")
     updatedAt   DateTime  @updatedAt @map("updated_at")
     
     user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@map("notifications")
   }
   
   // Add relation to User model
   model User {
     // Existing fields
     notifications Notification[]
   }
   ```

2. **Permission Codes**:
   ```typescript
   // src/permissions/constants/permission-codes.ts
   export enum PermissionResource {
     // Existing resources
     NOTIFICATION = 'NOTIFICATION',
   }
   
   // Add to PERMISSION_CODES
   NOTIFICATION_CREATE: createPermissionCode(PermissionResource.NOTIFICATION, PermissionAction.CREATE),
   NOTIFICATION_READ: createPermissionCode(PermissionResource.NOTIFICATION, PermissionAction.READ),
   NOTIFICATION_UPDATE: createPermissionCode(PermissionResource.NOTIFICATION, PermissionAction.UPDATE),
   NOTIFICATION_DELETE: createPermissionCode(PermissionResource.NOTIFICATION, PermissionAction.DELETE),
   ```

3. **Feature Implementation**:
   Follow the steps above to create the module, controller, service, DTOs, and tests.

4. **Usage in Other Services**:
   ```typescript
   // Example: Using the notification service in scan service
   @Injectable()
   export class ScansService {
     constructor(
       private prisma: PrismaService,
       private notificationsService: NotificationsService,
     ) {}
   
     async completeScan(scanId: string) {
       const scan = await this.prisma.scan.findUnique({
         where: { id: scanId },
         include: { workspace: true },
       });
       
       // Create notification when scan completes
       await this.notificationsService.create({
         userId: scan.workspace.ownerId,
         title: 'Scan Completed',
         message: `The scan for repository ${scan.repository.url} is complete.`,
         type: 'SCAN_COMPLETE',
       });
       
       return scan;
     }
   }
   ```

By following these guidelines, you can ensure that new features are implemented consistently and integrate properly with the existing codebase.
// test/workspaces.e2e-spec.ts
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';

describe('Workspaces (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Setup test database
    await setupTestDatabase();

    // Get JWT token
    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    jwtToken = loginResponse.body.accessToken;
  });

  async function setupTestDatabase() {
    // Clear test data
    await prismaService.auditLog.deleteMany();
    await prismaService.userWorkspace.deleteMany();
    await prismaService.workspace.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user
    const user = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: 'OWNER',
        orgName: 'Test Organization',
      },
    });

    userId = user.id;
  }

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('Create Workspace', () => {
    it('should create a new workspace', () => {
      return request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Test Workspace',
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Workspace');
          expect(res.body.ownerId).toBe(userId);
        });
    });

    it('should fail when workspace name is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('Get Workspaces', () => {
    it('should get all workspaces for the user', async () => {
      // Create a test workspace first
      await prismaService.workspace.create({
        data: {
          name: 'Test Workspace for List',
          ownerId: userId,
        },
      });

      return request(app.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBeTruthy();
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
        });
    });
  });

  // Additional test cases for other workspace endpoints
});

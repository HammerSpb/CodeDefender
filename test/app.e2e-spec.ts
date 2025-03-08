// test/app.e2e-spec.ts
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
  });

  async function setupTestDatabase() {
    // Clear test data
    await prismaService.auditLog.deleteMany();
    await prismaService.userWorkspace.deleteMany();
    await prismaService.scan.deleteMany();
    await prismaService.schedule.deleteMany();
    await prismaService.workspace.deleteMany();
    await prismaService.repository.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user
    await prismaService.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: 'OWNER',
        orgName: 'Test Organization',
        plan: 'STARTER',
      },
    });
  }

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('Authentication', () => {
    it('should authenticate user and return JWT token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should fail with 401 on invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  // More E2E tests for various endpoints
});

import { PrismaClient } from '@prisma/client';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';

let prisma: PrismaClient;
let container: StartedTestContainer;

export const setupTestDatabase = async () => {
  if (container) {
    return;
  }

  container = await new GenericContainer('mysql:8.0')
    .withEnvironment({
      MYSQL_ROOT_PASSWORD: 'test',
      MYSQL_DATABASE: 'test',
      MYSQL_USER: 'test',
      MYSQL_PASSWORD: 'test',
    })
    .withExposedPorts(3306)
    .start();

  const port = container.getMappedPort(3306);
  console.log(`Test database is running on port: ${port}`);

  process.env.DATABASE_URL = `mysql://test:test@localhost:${port}/test`;
  console.log(`Database URL: ${process.env.DATABASE_URL}`);

  // Run Prisma migrations
  try {
    console.log('프리즈마 마이그레이션 시작');
    // 먼저 prisma generate 실행
    execSync('npx prisma generate', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });
    console.log('프리즈마 generate 완료');

    // db push로 스키마 적용
    execSync('npx prisma db push --force-reset', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });
    console.log('프리즈마 db push 완료');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
};

export const getPrismaClient = () => {
  if (prisma) {
    return prisma;
  }
  const url = process.env.DATABASE_URL;
  prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log:
      process.env.DB_LOGGING_ENABLED === 'true'
        ? ['query', 'info', 'warn', 'error']
        : [],
  });

  return prisma;
};

export const cleanupDatabase = async () => {
  const prisma = getPrismaClient();

  // 모든 테이블 목록 조회
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_TYPE = 'BASE TABLE'
    AND TABLE_NAME NOT IN ('_prisma_migrations')
  `;

  // 외래 키 체크 비활성화
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  // 모든 테이블 truncate
  for (const { TABLE_NAME } of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\``);
  }

  // 외래 키 체크 다시 활성화
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
};

export const teardownTestDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (container) {
    await container.stop();
  }
};

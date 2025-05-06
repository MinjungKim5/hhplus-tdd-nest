import { setupTestDatabase } from './prisma.util';
import { setupRedis } from './redis.util';

const init = async () => {
  await setupTestDatabase();
  await setupRedis();
};

export default init;

import { teardownTestDatabase } from './prisma.util';
import { teardownRedis } from './redis.util';

const down = async () => {
  await teardownTestDatabase();
};

export default down;

import { teardownTestDatabase } from './prisma.util';

const down = async () => {
  await teardownTestDatabase();
};

export default down;

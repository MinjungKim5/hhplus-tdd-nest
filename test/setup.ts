import { setupTestDatabase } from './prisma.util';

const init = async () => {
  await setupTestDatabase();
};

export default init;

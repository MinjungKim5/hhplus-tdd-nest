import { getPrismaClient, cleanupDatabase } from '../prisma.util';

describe('Should return expected result', () => {
  let prisma: any;

  beforeAll(async () => {
    prisma = getPrismaClient();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  it('Should verify database connection by creating and reading a user', async () => {
    // given
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      point: 1000,
    };

    // when
    const createdUser = await prisma.user.create({
      data: testUser,
    });

    // then
    expect(createdUser).toMatchObject(testUser);

    // verify we can read the user
    const foundUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(foundUser).toMatchObject(testUser);
  });

  it('Should 1=1', async () => {
    // given

    //when

    //then

    expect(1).toEqual(1);
  });
});

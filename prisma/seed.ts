import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Product 데이터 시드
  const productData = fs.readFileSync('test/products-dataset.json', 'utf-8');
  const products = JSON.parse(productData);

  for (const product of products) {
    await prisma.product.create({
      data: {
        productId: product.productId,
        name: product.name,
        category: product.category,
        brand: product.brand,
      },
    });
  }

  // User 데이터 시드
  const userData = fs.readFileSync('test/users-dataset.json', 'utf-8');
  const users = JSON.parse(userData);

  for (const user of users) {
    await prisma.user.create({
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        point: user.point,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
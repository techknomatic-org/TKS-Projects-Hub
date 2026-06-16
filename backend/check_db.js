import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB Check ---');
  try {
    const products = await prisma.product.findMany();
    console.log(`Products in DB (${products.length}):`);
    products.forEach(p => console.log(` - [${p.id}] ${p.name}`));

    const users = await prisma.user.findMany({
      include: {
        taggedProducts: true
      }
    });
    console.log(`Users in DB (${users.length}):`);
    users.forEach(u => {
      const prods = u.taggedProducts.map(p => p.name).join(', ');
      console.log(` - [${u.id}] ${u.name} (${u.email}) - Role: ${u.role} - Active: ${u.isActive} - Tagged Products: ${prods}`);
    });
  } catch (err) {
    console.error('Database query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

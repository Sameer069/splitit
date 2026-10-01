import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed expense categories
  const categories = [
    { name: 'Food', icon: 'restaurant' },
    { name: 'Groceries', icon: 'shopping_cart' },
    { name: 'Rent', icon: 'home' },
    { name: 'Utilities', icon: 'electrical_services' },
    { name: 'Transport', icon: 'directions_car' },
    { name: 'Entertainment', icon: 'movie' },
    { name: 'Healthcare', icon: 'local_hospital' },
    { name: 'Shopping', icon: 'shopping_bag' },
    { name: 'Travel', icon: 'flight' },
    { name: 'Other', icon: 'more_horiz' },
  ];

  for (const category of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Seeded expense categories');

  const count = await prisma.expenseCategory.count();
  console.log(`📊 Total categories: ${count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

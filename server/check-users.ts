import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        authProvider: true,
        createdAt: true,
      },
    });

    console.log('\n=== Users in Database ===');
    console.log(`Total users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('No users found in database!');
    } else {
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Provider: ${user.authProvider}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // Check specific email
    const specificUser = await prisma.user.findUnique({
      where: { email: 'sameer@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });
    
    if (specificUser) {
      console.log('=== User "sameer@gmail.com" EXISTS ===');
      console.log(`  Name: ${specificUser.name}`);
      console.log(`  Password hash length: ${specificUser.passwordHash?.length || 0}`);
      console.log(`  Has password: ${!!specificUser.passwordHash}`);
    } else {
      console.log('=== User "sameer@gmail.com" NOT FOUND ===');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

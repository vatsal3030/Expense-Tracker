import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.expenseShare.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.recurringExpense.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.friendship.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create demo users
  const demoUsers = [
    {
      email: 'alex@example.com',
      name: 'Alex Johnson',
      phone: '+91 98765 43210',
      defaultCurrency: 'INR',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      email: 'sam@example.com',
      name: 'Sam Wilson',
      phone: '+91 98765 43211',
      defaultCurrency: 'INR',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      email: 'priya@example.com',
      name: 'Priya Sharma',
      phone: '+91 98765 43212',
      defaultCurrency: 'INR',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      email: 'rohan@example.com',
      name: 'Rohan Mehta',
      phone: '+91 98765 43213',
      defaultCurrency: 'INR',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  ];

  const createdUsers = [];
  for (const u of demoUsers) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
    console.log(` Created user: ${user.name} (${user.email})`);
  }

  const [alex, sam, priya, rohan] = createdUsers;

  // 2. Create Friendships
  await prisma.friendship.createMany({
    data: [
      { userId: alex.id, friendId: sam.id, status: 'ACCEPTED' },
      { userId: alex.id, friendId: priya.id, status: 'ACCEPTED' },
      { userId: alex.id, friendId: rohan.id, status: 'ACCEPTED' },
      { userId: sam.id, friendId: priya.id, status: 'ACCEPTED' },
    ],
  });
  console.log(' Friendships established');

  // 3. Create Groups
  const goaTrip = await prisma.group.create({
    data: {
      name: 'Goa Weekend Trip 🏖️',
      description: 'Expenses for Goa vacation with the gang',
      type: 'TRIP',
      currency: 'INR',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: sam.id, role: 'MEMBER' },
          { userId: priya.id, role: 'MEMBER' },
          { userId: rohan.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const flatRent = await prisma.group.create({
    data: {
      name: 'Apartment 402 🏠',
      description: 'Monthly flat rent and utilities',
      type: 'HOME',
      currency: 'INR',
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN' },
          { userId: sam.id, role: 'MEMBER' },
        ],
      },
    },
  });
  console.log(' Created demo groups: Goa Trip & Apartment 402');

  // 4. Create Expenses & Shares
  // Expense 1: Villa Booking (Paid by Alex, split equally between all 4)
  const exp1 = await prisma.expense.create({
    data: {
      groupId: goaTrip.id,
      paidById: alex.id,
      createdById: alex.id,
      description: 'Beach Villa 3 Nights',
      amount: 16000,
      currency: 'INR',
      category: 'TRAVEL',
      splitType: 'EQUAL',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      shares: {
        create: [
          { userId: alex.id, amount: 4000 },
          { userId: sam.id, amount: 4000 },
          { userId: priya.id, amount: 4000 },
          { userId: rohan.id, amount: 4000 },
        ],
      },
    },
  });

  // Expense 2: Seafood Dinner (Paid by Priya, split equally between all 4)
  const exp2 = await prisma.expense.create({
    data: {
      groupId: goaTrip.id,
      paidById: priya.id,
      createdById: priya.id,
      description: 'Fisherman’s Wharf Dinner',
      amount: 4800,
      currency: 'INR',
      category: 'FOOD',
      splitType: 'EQUAL',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      shares: {
        create: [
          { userId: alex.id, amount: 1200 },
          { userId: sam.id, amount: 1200 },
          { userId: priya.id, amount: 1200 },
          { userId: rohan.id, amount: 1200 },
        ],
      },
    },
  });

  // Expense 3: Car Rental & Fuel (Paid by Sam, split equally between all 4)
  const exp3 = await prisma.expense.create({
    data: {
      groupId: goaTrip.id,
      paidById: sam.id,
      createdById: sam.id,
      description: 'Self-drive SUV Rental & Fuel',
      amount: 6000,
      currency: 'INR',
      category: 'TRANSPORT',
      splitType: 'EQUAL',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      shares: {
        create: [
          { userId: alex.id, amount: 1500 },
          { userId: sam.id, amount: 1500 },
          { userId: priya.id, amount: 1500 },
          { userId: rohan.id, amount: 1500 },
        ],
      },
    },
  });

  // Expense 4: Wifi & Electricity (Apartment, Paid by Alex, split between Alex & Sam)
  await prisma.expense.create({
    data: {
      groupId: flatRent.id,
      paidById: alex.id,
      createdById: alex.id,
      description: 'High-speed Fiber Broadband',
      amount: 1499,
      currency: 'INR',
      category: 'UTILITIES',
      splitType: 'EQUAL',
      date: new Date(),
      shares: {
        create: [
          { userId: alex.id, amount: 749.5 },
          { userId: sam.id, amount: 749.5 },
        ],
      },
    },
  });

  console.log(' Created expenses with automatic share calculations');

  // 5. Create Budgets for Alex
  await prisma.budget.createMany({
    data: [
      { userId: alex.id, category: 'FOOD', amount: 8000, period: 'MONTHLY', alertAt: 80 },
      { userId: alex.id, category: 'TRAVEL', amount: 20000, period: 'MONTHLY', alertAt: 75 },
      { userId: alex.id, category: 'UTILITIES', amount: 3000, period: 'MONTHLY', alertAt: 90 },
      { userId: alex.id, category: 'ENTERTAINMENT', amount: 5000, period: 'MONTHLY', alertAt: 80 },
    ],
  });
  console.log(' Set up monthly category budgets');

  // 6. Activities
  await prisma.activity.createMany({
    data: [
      { userId: alex.id, groupId: goaTrip.id, type: 'GROUP_CREATED', message: 'created "Goa Weekend Trip 🏖️"' },
      { userId: alex.id, groupId: goaTrip.id, expenseId: exp1.id, type: 'EXPENSE_CREATED', message: 'added "Beach Villa 3 Nights" (₹16,000)' },
      { userId: priya.id, groupId: goaTrip.id, expenseId: exp2.id, type: 'EXPENSE_CREATED', message: 'added "Fisherman’s Wharf Dinner" (₹4,800)' },
      { userId: sam.id, groupId: goaTrip.id, expenseId: exp3.id, type: 'EXPENSE_CREATED', message: 'added "Self-drive SUV Rental & Fuel" (₹6,000)' },
    ],
  });
  console.log(' Seeded activity feed');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

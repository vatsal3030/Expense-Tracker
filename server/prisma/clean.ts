import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Purging test and mock data from database...');

  try {
    const deletedActivities = await prisma.activity.deleteMany({});
    console.log(`Deleted ${deletedActivities.count} activity entries.`);

    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`Deleted ${deletedNotifications.count} notification entries.`);

    const deletedBudgets = await prisma.budget.deleteMany({});
    console.log(`Deleted ${deletedBudgets.count} budget limits.`);

    const deletedSettlements = await prisma.settlement.deleteMany({});
    console.log(`Deleted ${deletedSettlements.count} settlement records.`);

    const deletedShares = await prisma.expenseShare.deleteMany({});
    console.log(`Deleted ${deletedShares.count} expense shares.`);

    const deletedExpenses = await prisma.expense.deleteMany({});
    console.log(`Deleted ${deletedExpenses.count} expenses.`);

    const deletedRecurring = await prisma.recurringExpense.deleteMany({});
    console.log(`Deleted ${deletedRecurring.count} recurring expenses.`);

    const deletedMembers = await prisma.groupMember.deleteMany({});
    console.log(`Deleted ${deletedMembers.count} group memberships.`);

    const deletedGroups = await prisma.group.deleteMany({});
    console.log(`Deleted ${deletedGroups.count} groups.`);

    const deletedFriendships = await prisma.friendship.deleteMany({});
    console.log(`Deleted ${deletedFriendships.count} friendships.`);

    // Remove demo seed users only (keeping any real Supabase authenticated user account safe)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: ['alex@example.com', 'sam@example.com', 'priya@example.com', 'rohan@example.com'],
        },
      },
    });
    console.log(`Deleted ${deletedUsers.count} demo test users.`);

    console.log('✨ Database clean complete! Ready for fresh production data.');
  } catch (err) {
    console.error('Error cleaning database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();

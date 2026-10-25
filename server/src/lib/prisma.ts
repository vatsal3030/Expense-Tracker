import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma instances in development (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          // If connection was reset or closed by remote host (P1017 / 10054 ConnectionReset)
          if (
            error?.code === 'P1017' ||
            error?.message?.includes('10054') ||
            error?.message?.includes('closed the connection') ||
            error?.message?.includes('ConnectionReset')
          ) {
            console.warn(`[Prisma] Connection was reset. Reconnecting and retrying ${model}.${operation}...`);
            return await query(args);
          }
          throw error;
        }
      },
    },
  },
});

export default prisma;

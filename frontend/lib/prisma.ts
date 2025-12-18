import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

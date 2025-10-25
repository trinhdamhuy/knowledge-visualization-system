import { PrismaClient } from "@prisma/client";

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

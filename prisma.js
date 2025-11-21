import { PrismaClient } from "./prisma/generated/client/index.js";

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: process.env.DATABASE_URL, // garante que sempre usa a URL correta
  });

// Em desenvolvimento, mantém apenas uma instância
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

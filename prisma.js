const { PrismaClient } = require("./prisma/generated/client/index.js");

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: process.env.DATABASE_URL,
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["error", "warn"],
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;

import { PrismaClient } from '../generated/prisma';

let prisma: PrismaClient | undefined;

declare global {
  var globalPrisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.globalPrisma) {
    global.globalPrisma = new PrismaClient();
  }
  prisma = global.globalPrisma;
}

export default prisma;

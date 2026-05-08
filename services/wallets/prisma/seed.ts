import { PrismaClient } from "../src/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.wallet.upsert({
    where: { userId: "player" },
    update: {},
    create: {
      id: "wallet-player",
      userId: "player",
      balance: 100000n, // 1000.00 em centavos
    },
  });

  await prisma.wallet.upsert({
    where: { userId: "player" },
    update: {},
    create: {
      id: "wallet-player2",
      userId: "player2",
      balance: 10000n, // 100.00 em centavos
    },
  });

  console.log("Seed concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
import { PrismaClient } from '../src/generated/client/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://admin:admin@localhost:5432/wallets"
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const wallets = await prisma.wallet.findMany();
  console.log('Wallets:', JSON.stringify(wallets, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
    , 2));

  await prisma.$disconnect();
}

main().catch(console.error);

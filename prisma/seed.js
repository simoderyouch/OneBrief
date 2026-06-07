const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required (set it in .env.local).");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function main() {
  const email = process.env.SEED_USER_EMAIL || "admin@local.test";
  const password = process.env.SEED_USER_PASSWORD || "admin1234";

  const passwordHash = await bcrypt.hash(password, 10);

  const prisma = createPrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        nickname: "Onebrief Studio",
        name: "Admin",
        passwordHash,
      },
      select: { id: true, email: true },
    });

    // Print credentials for the developer running the seed.
    // eslint-disable-next-line no-console
    console.log("Seed user ready:");
    // eslint-disable-next-line no-console
    console.log(`- email:    ${user.email}`);
    // eslint-disable-next-line no-console
    console.log(`- password: ${password}`);
    // eslint-disable-next-line no-console
    console.log(`- id:       ${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


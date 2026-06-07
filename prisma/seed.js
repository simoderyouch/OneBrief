const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { seedDemoData } = require("./seed-demo-data");

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
  const skipDemo = process.env.SEED_SKIP_DEMO === "1";

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
        defaultCurrency: "MAD",
        whatsappDefaultCountryCode: "212",
      },
      select: { id: true, email: true },
    });

    // eslint-disable-next-line no-console
    console.log("\n══════════════════════════════════════════");
    // eslint-disable-next-line no-console
    console.log("  OneBrief — seed complete");
    // eslint-disable-next-line no-console
    console.log("══════════════════════════════════════════\n");
    // eslint-disable-next-line no-console
    console.log("Dashboard login:");
    // eslint-disable-next-line no-console
    console.log(`  email:    ${user.email}`);
    // eslint-disable-next-line no-console
    console.log(`  password: ${password}\n`);

    if (skipDemo) {
      // eslint-disable-next-line no-console
      console.log("(Demo data skipped — set SEED_SKIP_DEMO=0 to include)\n");
      return;
    }

    const portalLinks = await seedDemoData(prisma, user.id);

    // eslint-disable-next-line no-console
    console.log("Client portal: open any link below — no login required.\n");

    // eslint-disable-next-line no-console
    console.log("Demo projects:\n");
    for (const link of portalLinks) {
      // eslint-disable-next-line no-console
      console.log(`  • ${link.title}`);
      // eslint-disable-next-line no-console
      console.log(`    ${link.scenario}`);
      // eslint-disable-next-line no-console
      console.log(`    Dashboard:  http://localhost:3000${link.dashboard}`);
      if (link.clientPortal.startsWith("/")) {
        // eslint-disable-next-line no-console
        console.log(`    Client:     http://localhost:3000${link.clientPortal}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`    Client:     ${link.clientPortal}`);
      }
      // eslint-disable-next-line no-console
      console.log("");
    }

    // eslint-disable-next-line no-console
    console.log("Re-run anytime:  npm run seed\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";

async function main() {
  const company = await prisma.company.create({
    data: {
      name: "Test1 Company1"
    },
  });

  console.log("Seeded Company:", company);
  logger.info(`Seeded Company ID: ${company.id}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
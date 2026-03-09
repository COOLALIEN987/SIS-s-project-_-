import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const job = await prisma.scraperJob.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log("Latest Job Error:", job?.error);
}

check().catch(console.error).finally(() => prisma.$disconnect());

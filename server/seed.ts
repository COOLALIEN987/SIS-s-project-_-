import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const DEFAULT_TENANT = 'default-tenant';

    try {
        console.log("🌱 Starting database seeding...");

        // 1. Create the Tenant with the required 'slug'
        console.log("Creating Tenant...");
        await prisma.tenant.upsert({
            where: { id: DEFAULT_TENANT },
            update: {},
            create: {
                id: DEFAULT_TENANT,
                name: 'SIS Default Tenant',
                slug: 'sis-default' // ADDED SLUG TO FIX THE TS ERROR
            }
        });

        // 2. Create a Default Admin User
        console.log("Creating Admin User...");
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.upsert({
            where: { email: 'admin@sis.club' },
            update: {},
            create: {
                email: 'admin@sis.club',
                passwordHash: hashedPassword,
                name: 'SIS Admin',
                tenantId: DEFAULT_TENANT
            }
        });

        // 3. Create the Studio with all required fields
        console.log("Creating Studio...");
        await prisma.studio.upsert({
            where: { id: 'default-studio-1' },
            update: {},
            create: {
                id: 'default-studio-1',
                name: 'Bengaluru Central',
                address: 'Indiranagar, Bengaluru',
                phone: '+910000000000',
                lat: 12.9716, 
                lng: 77.5946,
                capacity: 100,
                tenantId: DEFAULT_TENANT
            }
        });

        console.log("✅ Database successfully seeded!");
    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
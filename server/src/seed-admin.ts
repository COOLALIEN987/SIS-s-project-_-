import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🌱 Seeding local SQLite database...');

        // 1. Create the Tenant first (Parent)
        const tenant = await prisma.tenant.upsert({
            where: { slug: 'antigravity-club' },
            update: {},
            create: {
                name: 'Antigravity Club',
                slug: 'antigravity-club',
                plan: 'PRO'
            }
        });

        // 2. Create the Admin User (Child)
        const hash = await bcrypt.hash('password123', 12);
        await prisma.user.upsert({
            where: { email: 'admin@sis.club' },
            update: {},
            create: {
                name: 'Admin',
                email: 'admin@sis.club',
                passwordHash: hash,
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });

        console.log('✅ Admin and Tenant seeded! You can now access all routes.');
    } catch (err) {
        console.error('❌ Seed failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
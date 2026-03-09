import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    try {
        const existUser = await prisma.user.findUnique({ where: { email: 'admin@sis.club' } });
        if (existUser) {
            console.log('User already exists');
            return;
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: 'Antigravity Club',
                slug: 'antigravity-club',
                plan: 'PRO'
            }
        });

        const hash = await bcrypt.hash('password123', 12);

        await prisma.user.create({
            data: {
                name: 'Admin',
                email: 'admin@sis.club',
                passwordHash: hash,
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });

        console.log('Admin user seeded!');
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

seed();

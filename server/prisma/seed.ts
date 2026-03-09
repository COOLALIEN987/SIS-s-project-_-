import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with test data for Antigravity...');

    // 1. Create a Master Tenant
    const tenantId = 'test-tenant-123';
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'SIS HQ',
            slug: 'sis-hq',
            plan: 'ENTERPRISE'
        }
    });

    // 2. Create Admin User
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@sis.club' },
        update: {},
        create: {
            id: uuidv4(),
            tenantId: tenant.id,
            name: 'Admin User',
            email: 'admin@sis.club',
            passwordHash,
            role: 'ADMIN'
        }
    });

    // 3. Clear existing test leads
    await prisma.interaction.deleteMany({});
    await prisma.lead.deleteMany({ where: { tenantId } });

    // 4. Create Mock Leads for CRM
    console.log('Generating leads...');

    const mockLeads = [
        { name: 'Rohan Deshmukh', phone: '919876543201', status: 'NEW', source: 'INSTAGRAM_FORM', score: 85, city: 'Mumbai', locality: 'Bandra', occupation: 'Director of Ops', isB2B: false },
        { name: 'Aanya Patel', phone: '919876543202', status: 'CONTACTED', source: 'WEBSITE_FORM', score: 92, city: 'Mumbai', locality: 'Juhu', occupation: 'Founder', isB2B: false },
        { name: 'Karan Singh', phone: '919876543203', status: 'INTERESTED', source: 'REFERRAL', score: 65, city: 'Mumbai', locality: 'South Mumbai', occupation: 'Banker', isB2B: false },
        { name: 'Priya Sharma', phone: '919876543204', status: 'TRIAL_BOOKED', source: 'INSTAGRAM_FORM', score: 98, city: 'Mumbai', locality: 'Bandra', occupation: 'Tech Lead', isB2B: false },
        { name: 'Vikram Malhotra', phone: '919876543205', status: 'PROPOSAL_SENT', source: 'LINKEDIN', score: 95, city: 'Mumbai', locality: 'Juhu', occupation: 'CEO', isB2B: true, company: 'InnovateX' },
        { name: 'Neha Gupta', phone: '919876543206', status: 'CONVERTED', source: 'GOOGLE_PLACES', score: 88, city: 'Mumbai', locality: 'South Mumbai', occupation: 'Consultant', isB2B: false },
    ];

    for (const l of mockLeads) {
        const lead = await prisma.lead.create({
            data: {
                tenantId,
                ...(l as any)
            }
        });

        // 5. Add Interactions
        await prisma.interaction.create({
            data: {
                leadId: lead.id,
                type: 'WHATSAPP_OUT',
                notes: `Hi ${l.name}, saw you were interested in Antigravity.`,
                date: new Date(Date.now() - 86400000 * 2) // 2 days ago
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

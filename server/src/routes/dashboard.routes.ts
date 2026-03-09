import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'default-tenant';

// GET /api/dashboard/kpis
router.get('/kpis', async (req: any, res) => {
    try {
        const [totalLeads, hotLeads, trialsThisMonth, activeMembers, expiringSoon] = await Promise.all([
            prisma.lead.count({ where: { tenantId: DEFAULT_TENANT } }),
            prisma.lead.count({ where: { tenantId: DEFAULT_TENANT, score: { gte: 70 } } }),
            prisma.trialBooking.count({
                where: { tenantId: DEFAULT_TENANT, scheduledAt: { gte: new Date(new Date().setDate(1)) } }
            }),
            prisma.member.count({ where: { tenantId: DEFAULT_TENANT, renewalStatus: 'ACTIVE' } }),
            prisma.member.count({
                where: {
                    tenantId: DEFAULT_TENANT,
                    currentTermEnd: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                    renewalStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] }
                }
            })
        ]);

        const allActive = await prisma.member.findMany({ where: { tenantId: DEFAULT_TENANT, renewalStatus: 'ACTIVE' }, select: { monthlyRate: true } });
        const mrr = allActive.reduce((acc, member) => acc + member.monthlyRate, 0);

        res.json({ success: true, data: { totalLeads, hotLeads, trialsThisMonth, activeMembers, expiringSoon, mrr } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/funnel
router.get('/funnel', async (req: any, res) => {
    try {
        const groups = await prisma.lead.groupBy({
            by: ['status'],
            where: { tenantId: DEFAULT_TENANT },
            _count: { id: true }
        });

        const funnelStages = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL_BOOKED', 'TRIAL_ATTENDED', 'PROPOSAL_SENT', 'CONVERTED', 'LOST'];
        const countMap = Object.fromEntries(groups.map(g => [g.status, g._count.id]));
        const data = funnelStages.map(stage => ({ stage, count: countMap[stage] || 0 }));

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/studios
router.get('/studios', async (req: any, res) => {
    try {
        const studios = await prisma.studio.findMany({
            where: { tenantId: DEFAULT_TENANT },
            include: {
                _count: { select: { leads: true, members: true } },
                coaches: { select: { currentLoad: true, maxClients: true, name: true, isAvailable: true } }
            }
        });

        const data = studios.map(studio => ({
            id: studio.id,
            name: studio.name,
            leadsNearby: studio._count.leads,
            activeMembers: studio._count.members,
            capacityPercent: Math.round((studio._count.members / studio.capacity) * 100),
            coaches: studio.coaches
        }));

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/activities
router.get('/activities', async (req: any, res) => {
    try {
        const interactions = await prisma.interaction.findMany({
            where: { lead: { tenantId: DEFAULT_TENANT } },
            take: 20,
            orderBy: { date: 'desc' },
            include: { lead: { select: { name: true } } }
        });
        res.json({ success: true, data: interactions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
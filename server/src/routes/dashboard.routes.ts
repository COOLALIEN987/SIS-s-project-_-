import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/kpis
router.get('/kpis', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user!.tenantId;

        const [totalLeads, hotLeads, trialsThisMonth, activeMembers, expiringSoon] = await Promise.all([
            prisma.lead.count({ where: { tenantId } }),
            prisma.lead.count({ where: { tenantId, score: { gte: 70 } } }),
            prisma.trialBooking.count({
                where: { tenantId, scheduledAt: { gte: new Date(new Date().setDate(1)) } }
            }),
            prisma.member.count({ where: { tenantId, renewalStatus: 'ACTIVE' } }),
            prisma.member.count({
                where: {
                    tenantId,
                    currentTermEnd: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
                    renewalStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] }
                }
            })
        ]);

        // Simple Monthly Recurring Revenue calculation
        const allActive = await prisma.member.findMany({ where: { tenantId, renewalStatus: 'ACTIVE' }, select: { monthlyRate: true } });
        const mrr = allActive.reduce((acc, member) => acc + member.monthlyRate, 0);

        res.json({ success: true, data: { totalLeads, hotLeads, trialsThisMonth, activeMembers, expiringSoon, mrr } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/funnel
router.get('/funnel', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const tenantId = req.user!.tenantId;
        const groups = await prisma.lead.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: { id: true }
        });

        // Order based on the 8-stage funnel
        const funnelStages = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL_BOOKED', 'TRIAL_ATTENDED', 'PROPOSAL_SENT', 'CONVERTED', 'LOST', 'INCOMPLETE', 'NOT_INTERESTED', 'FOLLOW_UP_LATER'];

        const countMap = Object.fromEntries(groups.map(g => [g.status, g._count.id]));
        const data = funnelStages.map(stage => ({
            stage,
            count: countMap[stage] || 0
        }));

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/heatmap
router.get('/heatmap', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const leadsByLocality = await prisma.lead.groupBy({
            by: ['locality'],
            where: { tenantId: req.user!.tenantId, locality: { not: null } },
            _count: { id: true }
        });

        res.json({ success: true, data: leadsByLocality });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/studios
router.get('/studios', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const studios = await prisma.studio.findMany({
            where: { tenantId: req.user!.tenantId },
            include: {
                _count: { select: { leads: true, members: true } },
                coaches: { select: { currentLoad: true, maxClients: true, name: true, isAvailable: true } }
            }
        });

        const data = studios.map(studio => {
            const activeMembers = studio._count.members;
            return {
                id: studio.id,
                name: studio.name,
                leadsNearby: studio._count.leads,
                activeMembers,
                capacityPercent: Math.round((activeMembers / studio.capacity) * 100),
                coaches: studio.coaches
            };
        });

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/dashboard/activities
router.get('/activities', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const interactions = await prisma.interaction.findMany({
            where: { lead: { tenantId: req.user!.tenantId } },
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

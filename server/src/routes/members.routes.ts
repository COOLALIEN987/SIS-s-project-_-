import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/members
router.get('/', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { studioId, coachId, plan, renewalStatus, churnRisk } = req.query;

        const where: any = { tenantId: req.user!.tenantId };
        if (studioId) where.studioId = studioId as string;
        if (coachId) where.coachId = coachId as string;
        if (plan) where.plan = plan as string;
        if (renewalStatus) where.renewalStatus = renewalStatus as string;
        if (churnRisk) where.churnRisk = churnRisk as string;

        const members = await prisma.member.findMany({
            where,
            include: {
                lead: { select: { name: true, phone: true, email: true } },
                studio: { select: { name: true } },
                coach: { select: { name: true } }
            },
            orderBy: { currentTermEnd: 'asc' }
        });

        res.json({ success: true, data: members });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/members/expiring
router.get('/expiring', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const members = await prisma.member.findMany({
            where: {
                tenantId: req.user!.tenantId,
                currentTermEnd: { lte: thirtyDaysFromNow },
                renewalStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] }
            },
            include: {
                lead: { select: { name: true, phone: true } },
                coach: { select: { name: true } }
            },
            orderBy: { currentTermEnd: 'asc' }
        });

        res.json({ success: true, data: members });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/members/:id
router.get('/:id', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { id: req.params.id, tenantId: req.user!.tenantId },
            include: {
                lead: { include: { interactions: { orderBy: { date: 'desc' } } } },
                studio: true,
                coach: true
            }
        });

        if (!member) return res.status(404).json({ success: false, error: 'Member not found' });
        res.json({ success: true, data: member });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/members/:id
router.patch('/:id', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const member = await prisma.member.update({
            where: { id: req.params.id, tenantId: req.user!.tenantId },
            data: req.body
        });

        res.json({ success: true, data: member });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

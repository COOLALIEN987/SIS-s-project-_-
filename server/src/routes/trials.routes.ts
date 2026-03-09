import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/trials
router.post('/', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { leadId, studioId, coachId, scheduledAt } = req.body;

        // Auto-assign coach if not provided based on lowest load
        let assignedCoachId = coachId;
        if (!assignedCoachId) {
            const coaches = await prisma.coach.findMany({
                where: { studioId, tenantId: req.user!.tenantId, isAvailable: true },
                orderBy: { currentLoad: 'asc' }
            });
            if (coaches.length > 0) {
                assignedCoachId = coaches[0].id;
            }
        }

        const trial = await prisma.trialBooking.create({
            data: {
                tenantId: req.user!.tenantId,
                leadId,
                studioId,
                coachId: assignedCoachId,
                scheduledAt: new Date(scheduledAt),
                status: 'PENDING'
            }
        });

        // Update lead status
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: 'TRIAL_BOOKED' }
        });

        res.status(201).json({ success: true, data: trial });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/trials
router.get('/', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { status, studioId, coachId, startDate, endDate } = req.query;

        const where: any = { tenantId: req.user!.tenantId };
        if (status) where.status = status as string;
        if (studioId) where.studioId = studioId as string;
        if (coachId) where.coachId = coachId as string;
        if (startDate && endDate) {
            where.scheduledAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        const trials = await prisma.trialBooking.findMany({
            where,
            include: {
                lead: { select: { name: true, phone: true } },
                coach: { select: { name: true } }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        res.json({ success: true, data: trials });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/trials/:id
router.patch('/:id', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { status, outcome, coachNotes } = req.body;

        const trial = await prisma.trialBooking.update({
            where: { id: req.params.id, tenantId: req.user!.tenantId },
            data: { status, outcome, coachNotes }
        });

        if (status === 'ATTENDED') {
            await prisma.lead.update({
                where: { id: trial.leadId },
                data: { status: 'TRIAL_ATTENDED' }
            });
        }

        res.json({ success: true, data: trial });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

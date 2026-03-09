import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'default-tenant';

router.post('/', async (req: any, res) => {
    try {
        const { leadId, studioId, coachId, scheduledAt } = req.body;
        let assignedCoachId = coachId;

        if (!assignedCoachId) {
            const coaches = await prisma.coach.findMany({
                where: { studioId, tenantId: DEFAULT_TENANT, isAvailable: true },
                orderBy: { currentLoad: 'asc' }
            });
            if (coaches.length > 0) assignedCoachId = coaches[0].id;
        }

        const trial = await prisma.trialBooking.create({
            data: {
                tenantId: DEFAULT_TENANT,
                leadId,
                studioId,
                coachId: assignedCoachId,
                scheduledAt: new Date(scheduledAt),
                status: 'PENDING'
            }
        });

        await prisma.lead.update({ where: { id: leadId }, data: { status: 'TRIAL_BOOKED' } });
        res.status(201).json({ success: true, data: trial });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/', async (req: any, res) => {
    try {
        const { status, studioId, coachId, startDate, endDate } = req.query;
        const where: any = { tenantId: DEFAULT_TENANT };
        if (status) where.status = status as string;
        if (studioId) where.studioId = studioId as string;
        if (coachId) where.coachId = coachId as string;

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

export default router;
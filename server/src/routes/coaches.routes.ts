import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/coaches
router.get('/', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { studioId } = req.query;
        const where: any = { tenantId: req.user!.tenantId };
        if (studioId) where.studioId = studioId as string;

        const coaches = await prisma.coach.findMany({
            where,
            include: { studio: { select: { name: true } } },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: coaches });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/coaches/:id
router.patch('/:id', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const coach = await prisma.coach.update({
            where: { id: req.params.id, tenantId: req.user!.tenantId },
            data: req.body
        });

        res.json({ success: true, data: coach });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/coaches/:id/availability
router.get('/:id/availability', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const coach = await prisma.coach.findUnique({
            where: { id: req.params.id, tenantId: req.user!.tenantId },
            include: {
                trialBookings: {
                    where: {
                        scheduledAt: { gte: new Date() },
                        status: { in: ['PENDING', 'CONFIRMED'] }
                    }
                }
            }
        });

        if (!coach) return res.status(404).json({ success: false, error: 'Coach not found' });

        // In a real app, this would intersect with actual coach shift schedules
        // For now returning the scheduled trial bookings so frontend can disable those slots
        res.json({ success: true, data: { currentLoad: coach.currentLoad, maxClients: coach.maxClients, bookedSlots: coach.trialBookings } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'default-tenant';

router.get('/', async (req: any, res) => {
    try {
        const { studioId, coachId, plan, renewalStatus } = req.query;
        const where: any = { tenantId: DEFAULT_TENANT };
        if (studioId) where.studioId = studioId as string;
        if (coachId) where.coachId = coachId as string;
        if (plan) where.plan = plan as string;
        if (renewalStatus) where.renewalStatus = renewalStatus as string;

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

export default router;  
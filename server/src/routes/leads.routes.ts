import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../utils/phone.util';
import { calculateDistance } from '../utils/distance.util';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'default-tenant';

// GET /api/leads
router.get('/', async (req: any, res) => {
    try {
        const { status, limit = '50', page = '1', source, locality, isB2B } = req.query;

        const where: any = { tenantId: DEFAULT_TENANT };
        if (status) where.status = status as string;
        if (source) where.source = source as string;
        if (locality) where.locality = locality as string;
        if (isB2B !== undefined) where.isB2B = isB2B === 'true';

        const leads = await prisma.lead.findMany({
            where,
            take: parseInt(limit as string),
            skip: (parseInt(page as string) - 1) * parseInt(limit as string),
            orderBy: { createdAt: 'desc' },
            include: {
                assignedTo: { select: { id: true, name: true } },
                nearestStudio: { select: { id: true, name: true } }
            }
        });

        const total = await prisma.lead.count({ where });
        res.json({ success: true, data: leads, meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/leads/:id
router.get('/:id', async (req: any, res) => {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: req.params.id, tenantId: DEFAULT_TENANT },
            include: {
                interactions: { orderBy: { date: 'desc' } },
                trialBooking: { include: { coach: true } }
            }
        });
        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/leads
router.post('/', async (req: any, res) => {
    try {
        const data = req.body;
        let validPhone = data.phone;
        let phoneValidated = false;

        if (data.phone) {
            const formatted = validateAndFormatPhone(data.phone);
            if (!formatted) return res.status(400).json({ success: false, error: 'Invalid Indian mobile number' });
            validPhone = formatted;
            phoneValidated = true;

            const existing = await prisma.lead.findFirst({
                where: { phone: validPhone, tenantId: DEFAULT_TENANT }
            });
            if (existing) return res.status(409).json({ success: false, error: 'Lead with this phone number already exists' });
        }

        let nearestStudioId = null;
        let minDistance = Infinity;

        if (data.lat && data.lng) {
            const studios = await prisma.studio.findMany({ where: { tenantId: DEFAULT_TENANT } });
            for (const studio of studios) {
                const dist = calculateDistance(data.lat, data.lng, studio.lat, studio.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestStudioId = studio.id;
                }
            }
        }

        const lead = await prisma.lead.create({
            data: {
                ...data,
                tenantId: DEFAULT_TENANT,
                phone: validPhone,
                phoneValidated,
                nearestStudioId,
                distanceToStudio: minDistance !== Infinity ? minDistance : null,
            }
        });
        res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req: any, res) => {
    try {
        const data = req.body;
        if (data.phone) {
            const formatted = validateAndFormatPhone(data.phone);
            if (!formatted) return res.status(400).json({ success: false, error: 'Invalid Indian mobile number' });
            data.phone = formatted;
            data.phoneValidated = true;
        }

        const lead = await prisma.lead.update({
            where: { id: req.params.id, tenantId: DEFAULT_TENANT },
            data
        });
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
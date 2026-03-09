import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';
import { enqueueScraperJob } from '../services/queue.service';

const router = Router();
const prisma = new PrismaClient();

// POST /api/scraper
router.post('/', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { type, query, city, locality } = req.body;

        if (!type || !query) {
            return res.status(400).json({ success: false, error: 'Type and Query are required' });
        }

        const job = await enqueueScraperJob(type, query, city || 'Mumbai', locality || '', req.user!.tenantId);

        res.status(202).json({ success: true, message: 'Scraping job queued', data: job });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/scraper/jobs
router.get('/jobs', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const jobs = await prisma.scraperJob.findMany({
            where: { tenantId: req.user!.tenantId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json({ success: true, data: jobs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

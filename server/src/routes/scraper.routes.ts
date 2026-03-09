import { Router } from 'express';
import { generateLeadsViaSearch } from '../services/ai.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'antigravity-tenant-id';

router.post('/', async (req, res) => {
    try {
        const { type, query, city, locality } = req.body;
        const leads = await generateLeadsViaSearch(type || query, city, locality);

        const savedLeads = await Promise.all(leads.map((lead: any) => 
            prisma.lead.create({
                data: { ...lead, status: 'NEW', source: 'GEMINI_SEARCH', tenantId: DEFAULT_TENANT }
            })
        ));

        res.json({ success: true, count: savedLeads.length });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mock jobs list so the dashboard stays clean
router.get('/jobs', (req, res) => res.json({ success: true, data: [] }));

export default router;
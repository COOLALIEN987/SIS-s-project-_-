import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';
import Papa from 'papaparse';

const router = Router();
const prisma = new PrismaClient();

router.get('/leads.csv', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { status, source, locality, score_min } = req.query;

        const where: any = { tenantId: req.user!.tenantId };
        if (status) where.status = status as string;
        if (source) where.source = source as string;
        if (locality) where.locality = locality as string;
        if (score_min) where.score = { gte: parseInt(score_min as string) };

        const leads = await prisma.lead.findMany({
            where,
            include: { assignedTo: { select: { name: true } }, nearestStudio: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const csvData = leads.map(l => ({
            ID: l.id,
            Name: l.name,
            Phone: l.phone,
            Email: l.email,
            Company: l.company,
            Occupation: l.occupation,
            City: l.city,
            Locality: l.locality,
            Address: l.address,
            Status: l.status,
            Score: l.score,
            Source: l.source,
            Persona: l.persona,
            IsB2B: l.isB2B,
            NearestStudio: l.nearestStudio?.name || '',
            AssignedTo: l.assignedTo?.name || '',
            CreatedAt: l.createdAt.toISOString(),
            LastContacted: l.lastContactedAt ? l.lastContactedAt.toISOString() : ''
        }));

        const csv = Papa.unparse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="AG_Leads_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

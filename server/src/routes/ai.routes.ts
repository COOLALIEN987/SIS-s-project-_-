import { Router } from 'express';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';
import { scoreLead, draftWhatsAppMessage, generateFaqResponse } from '../services/ai.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/ai/score/:leadId
router.post('/score/:leadId', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: req.params.leadId, tenantId: req.user!.tenantId }
        });

        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

        const aiResult = await scoreLead(lead);

        if (aiResult) {
            const updatedLead = await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    score: Math.min(100, Math.max(0, aiResult.score)),
                    churnRisk: aiResult.churnRisk,
                    aiSummary: aiResult.summary,
                }
            });
            return res.json({ success: true, data: updatedLead });
        }

        res.status(500).json({ success: false, error: 'AI scoring failed' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/ai/draft
router.post('/draft', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { leadId, objective } = req.body;

        const lead = await prisma.lead.findUnique({
            where: { id: leadId, tenantId: req.user!.tenantId }
        });

        if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

        const message = await draftWhatsAppMessage(lead, objective);
        res.json({ success: true, data: { message } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/ai/faq
router.post('/faq', async (req, res) => {
    // Can be public (used for website chat widget)
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ success: false, error: 'Question required' });

        const answer = await generateFaqResponse(question);
        res.json({ success: true, data: { answer } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

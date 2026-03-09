import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    initializeWhatsApp,
    getQrCode,
    sendWhatsAppMessage,
    logoutWhatsApp
} from '../services/whatsapp.service';
import { generateAiReply } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();
const DEFAULT_TENANT = 'antigravity-tenant-id'; // Matches your seed-admin file

// POST /api/whatsapp/init
router.post('/init', async (req: any, res) => {
    try {
        // Bypassing Auth: Using hardcoded tenant
        initializeWhatsApp(DEFAULT_TENANT).catch(console.error);
        res.json({ success: true, message: 'WhatsApp initialization started' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/whatsapp/status
router.get('/status', async (req: any, res) => {
    try {
        const session = await prisma.whatsappSession.findUnique({
            where: { tenantId: DEFAULT_TENANT }
        });

        if (!session) return res.json({ success: true, data: { status: 'DISCONNECTED', qr: null } });

        const liveQr = getQrCode(DEFAULT_TENANT);
        res.json({
            success: true,
            data: { status: session.status, qr: liveQr || session.lastQrCode, updatedAt: session.updatedAt }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/whatsapp/send
router.post('/send', async (req: any, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) return res.status(400).json({ success: false, error: 'Recipient and message required' });

        await sendWhatsAppMessage(DEFAULT_TENANT, to, message);

        const phoneNum = to.replace(/[^0-9]/g, '');
        const lead = await prisma.lead.findFirst({ where: { phone: phoneNum, tenantId: DEFAULT_TENANT } });

        if (lead) {
            await prisma.interaction.create({
                data: { leadId: lead.id, type: 'WHATSAPP_OUT', notes: message, date: new Date() }
            });
        }
        res.json({ success: true, message: 'Message sent' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/whatsapp/webhook (No changes needed, already public)
router.post('/webhook', async (req, res) => {
    const { tenantId = DEFAULT_TENANT, from, body, notifyName } = req.body;
    res.json({ success: true, message: 'Webhook received' });

    try {
        const aiResponseText = await generateAiReply(body); 
        await sendWhatsAppMessage(tenantId, from, aiResponseText);

        const phoneNum = from.replace(/[^0-9]/g, '');
        const lead = await prisma.lead.findFirst({ where: { phone: phoneNum, tenantId } });
        if (lead) {
            await prisma.interaction.create({
                data: { 
                    leadId: lead.id, 
                    type: 'WHATSAPP_IN_OUT', 
                    notes: `User: ${body} | AI: ${aiResponseText}`, 
                    date: new Date() 
                }
            });
        }
    } catch (error) {
        console.error("Failed to process AI webhook response:", error);
    }
});

export default router;
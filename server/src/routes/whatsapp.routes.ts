import { Router } from 'express';
import { authenticate, tenantGuard, AuthRequest } from '../middleware/auth';
import {
    initializeWhatsApp,
    getQrCode,
    sendWhatsAppMessage,
    logoutWhatsApp
} from '../services/whatsapp.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/whatsapp/init
// Initialize client and start QR generation or restore session
router.post('/init', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        // Fire and forget initialization
        initializeWhatsApp(req.user!.tenantId).catch(console.error);
        res.json({ success: true, message: 'WhatsApp initialization started' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/whatsapp/status
// Poll this endpoint from the React dashboard to get the QR code or connection status
router.get('/status', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const session = await prisma.whatsappSession.findUnique({
            where: { tenantId: req.user!.tenantId }
        });

        if (!session) {
            return res.json({ success: true, data: { status: 'DISCONNECTED', qr: null } });
        }

        // Always prefer the live QR code in memory if available (since it refreshes)
        const liveQr = getQrCode(req.user!.tenantId);

        res.json({
            success: true,
            data: {
                status: session.status,
                qr: liveQr || session.lastQrCode,
                updatedAt: session.updatedAt
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/whatsapp/send
router.post('/send', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ success: false, error: 'Recipient and message required' });
        }

        await sendWhatsAppMessage(req.user!.tenantId, to, message);

        // Attempt to log interaction if we can find the lead
        const phoneNum = to.replace(/[^0-9]/g, '');
        const lead = await prisma.lead.findFirst({ where: { phone: phoneNum, tenantId: req.user!.tenantId } });

        if (lead) {
            await prisma.interaction.create({
                data: {
                    leadId: lead.id,
                    type: 'WHATSAPP_OUT',
                    notes: message,
                    date: new Date()
                }
            });
        }

        res.json({ success: true, message: 'Message sent' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/whatsapp/logout
router.post('/logout', authenticate, tenantGuard, async (req: AuthRequest, res) => {
    try {
        await logoutWhatsApp(req.user!.tenantId);
        res.json({ success: true, message: 'Logged out of WhatsApp' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAEMON_URL = 'http://localhost:3002';

/**
 * Initialize WhatsApp Client for a Tenant via Daemon
 */
export const initializeWhatsApp = async (tenantId: string) => {
    try {
        await fetch(`${DAEMON_URL}/api/whatsapp/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId })
        });

        // Wait for it to init, we don't handle QR in UI anymore since it's terminal only
        await prisma.whatsappSession.upsert({
            where: { tenantId },
            update: { status: 'QR_READY' },
            create: { tenantId, status: 'QR_READY' }
        });
    } catch (error) {
        console.error(`Failed to trigger daemon initialization for ${tenantId}:`, error);
    }
};

/**
 * Send a WhatsApp Message via Daemon
 */
export const sendWhatsAppMessage = async (tenantId: string, toPhone: string, message: string) => {
    try {
        const res = await fetch(`${DAEMON_URL}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, to: toPhone, message })
        });

        const data = await res.json() as any;
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Daemon failed to send message');
        }
        return true;
    } catch (error) {
        console.error(`Failed to send message to ${toPhone} via daemon:`, error);
        throw error;
    }
};

/**
 * Get current QR Code is deprecated since relying on terminal.
 * We'll just return null or throw.
 */
export const getQrCode = (tenantId: string) => {
    return null;
};

/**
 * Logout Client (Currently not fully implemented in basic daemon API, just updating DB)
 */
export const logoutWhatsApp = async (tenantId: string) => {
    await prisma.whatsappSession.update({
        where: { tenantId },
        data: { status: 'DISCONNECTED', lastQrCode: null }
    });
};

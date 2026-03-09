import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const clients: Map<string, Client> = new Map();

app.post('/api/whatsapp/init', async (req, res) => {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    if (clients.has(tenantId)) {
        return res.json({ success: true, message: 'Already initialized or initializing' });
    }

    console.log(`[Daemon] Initializing WhatsApp for tenant ${tenantId}...`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `tenant_${tenantId}`,
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log(`\n\n======================================================`);
        console.log(`   SCAN THIS QR CODE IN WHATSAPP TO LINK DEVICE (${tenantId})`);
        console.log(`======================================================\n`);
        qrcodeTerminal.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`[Daemon] WhatsApp client for tenant ${tenantId} is READY!`);
    });

    client.on('authenticated', () => {
        console.log(`[Daemon] WhatsApp client for tenant ${tenantId} AUTHENTICATED`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`[Daemon] WhatsApp auth failure for ${tenantId}:`, msg);
    });

    client.on('disconnected', (reason) => {
        console.log(`[Daemon] WhatsApp client disconnected for ${tenantId}: ${reason}`);
        clients.delete(tenantId);
    });

    client.on('message', async (message: Message) => {
        if (message.from === 'status@broadcast') return;
        // The main server will handle DB logging. We could forward this to a webhook on the main server if needed.
        console.log(`[Daemon] Incoming message from ${message.from}: ${message.body}`);
    });

    clients.set(tenantId, client);

    try {
        await client.initialize();
    } catch (err) {
        console.error(`[Daemon] Failed to init client for ${tenantId}:`, err);
        clients.delete(tenantId);
    }

    res.json({ success: true, message: 'Initialization started' });
});

app.post('/api/whatsapp/send', async (req, res) => {
    const { tenantId, to, message } = req.body;
    if (!tenantId || !to || !message) {
        return res.status(400).json({ error: 'tenantId, to, and message are required' });
    }

    const client = clients.get(tenantId);
    if (!client) {
        return res.status(400).json({ error: 'Client not initialized on this daemon' });
    }

    try {
        const state = await client.getState();
        if (state !== 'CONNECTED') {
            return res.status(400).json({ error: 'Client not connected' });
        }

        const chatId = `${to.replace(/[^0-9]/g, '')}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Message sent' });
    } catch (error: any) {
        console.error(`[Daemon] Send error:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/whatsapp/status', async (req, res) => {
    const { tenantId } = req.query;
    if (!tenantId || typeof tenantId !== 'string') return res.status(400).json({ error: 'tenantId required' });

    const client = clients.get(tenantId);
    if (!client) {
        return res.json({ status: 'DISCONNECTED' });
    }

    try {
        const state = await client.getState();
        res.json({ status: state === 'CONNECTED' ? 'CONNECTED' : 'INITIALIZING' });
    } catch {
        res.json({ status: 'INITIALIZING' }); // usually means it's waiting for QR
    }
});

const PORT = process.env.DAEMON_PORT || 3002;
app.listen(PORT, () => {
    console.log(`WhatsApp Terminal Daemon running on port ${PORT}`);
});

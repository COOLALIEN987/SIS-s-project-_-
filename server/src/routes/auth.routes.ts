import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, tenantName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
        if (existingTenant) {
            return res.status(400).json({ error: 'Tenant name already taken' });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: tenantName,
                slug,
                plan: 'PRO'
            }
        });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                tenantId: tenant.id,
                role: 'ADMIN'
            }
        });

        // Seed Studios for Antigravity Profile
        await prisma.studio.createMany({
            data: [
                {
                    tenantId: tenant.id,
                    name: 'Bandra',
                    address: 'Shailja Apartments, Nargis Dutt Road, Pali Hill, Bandra West, Mumbai 400050',
                    phone: '+919321041946',
                    lat: 19.0607,
                    lng: 72.8307,
                    capacity: 20
                },
                {
                    tenantId: tenant.id,
                    name: 'South Mumbai',
                    address: 'Belle View, Behind Wilson College, Chowpatty, Mumbai 400007',
                    phone: '+918355948290',
                    lat: 18.9540,
                    lng: 72.8104,
                    capacity: 15
                },
                {
                    tenantId: tenant.id,
                    name: 'Juhu',
                    address: 'Mahran Society, Gulmohar Road No. 12, Juhu, Mumbai 400044',
                    phone: '+917021719216',
                    lat: 19.0990,
                    lng: 72.8295,
                    capacity: 15
                }
            ]
        });

        const token = jwt.sign(
            { userId: user.id, tenantId: tenant.id, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenantId, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: { tenant: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            tenant: user.tenant
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

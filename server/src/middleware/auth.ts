import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        id: string;
        tenantId: string;
        role: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        req.user = {
            id: user.id,
            tenantId: user.tenantId,
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    }
};

export const tenantGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: 'Unauthorized: Tenant context missing' });
    }
    // Data access must use req.user.tenantId
    next();
};

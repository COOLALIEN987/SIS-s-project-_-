import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leadRoutes from './routes/leads.routes';
import dashboardRoutes from './routes/dashboard.routes';
import scraperRoutes from './routes/scraper.routes';

dotenv.config();
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ... existing imports ...
app.use(express.json());

// MASTER BYPASS MIDDLEWARE
app.use((req: any, res, next) => {
    req.user = { id: 'admin-id', tenantId: 'antigravity-tenant-id', role: 'ADMIN' };
    next();
});

// app.use('/api/auth', authRoutes); // Disable this
app.use('/api/leads', leadRoutes);
// ... existing routes ...

// MASTER BYPASS: Forces every request to have a valid user/tenant context
app.use((req: any, res, next) => {
    req.user = { 
        id: 'admin-id', 
        tenantId: 'antigravity-tenant-id', // ID from your seed-admin file
        role: 'ADMIN' 
    };
    next();
});

app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/scraper', scraperRoutes);

app.listen(3001, () => console.log(`🚀 Server bypassing auth on port 3001`));
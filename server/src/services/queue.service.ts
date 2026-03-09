import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { scrapeGooglePlaces } from './scraper/google-places';
import { scrapeLinkedIn } from './scraper/linkedin';
import { scrapeIndiaMart } from './scraper/indiamart';
import { scoreLead } from './ai.service';
import { sendWhatsAppMessage } from './whatsapp.service';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    // Add a retry strategy to prevent aggressive terminal spam when Upstash is missing
    retryStrategy: (times) => {
        if (redisUrl.includes('localhost') && times > 3) {
            return null; // Stop retrying after 3 attempts if local redis is missing
        }
        return Math.min(times * 50, 2000);
    }
});

// Suppress unhandled error crashes
connection.on('error', (err: any) => {
    if (err.code === 'ECONNREFUSED' && redisUrl.includes('localhost')) {
        // Silently ignore so the CRM can boot
    } else {
        console.error('Redis error:', err.message);
    }
});

// Helper to check if real Redis is available
const isRedisMissing = redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1');

// Scraper Queue
export const scraperQueue = isRedisMissing ? { add: async () => { } } as any : new Queue('scraper', { connection: connection as any });
export const aiQueue = isRedisMissing ? { add: async () => { } } as any : new Queue('ai-jobs', { connection: connection as any });
export const whatsappQueue = isRedisMissing ? { add: async () => { } } as any : new Queue('whatsapp', { connection: connection as any });

// Generalized Scraper Worker
export const scraperWorker = isRedisMissing ? null : new Worker('scraper', async (job: Job) => {
    const { jobId, type, query, city, locality, tenantId } = job.data;

    await prisma.scraperJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING', startedAt: new Date() }
    });

    try {
        let results = { recordsFound: 0, recordsSaved: 0, recordsRejected: 0, rejectionReasons: {} };

        if (type === 'GOOGLE_PLACES') {
            results = await scrapeGooglePlaces(query, city, locality, tenantId);
        } else if (type === 'LINKEDIN') {
            results = await scrapeLinkedIn(query, city, tenantId);
        } else if (type === 'INDIAMART') {
            results = await scrapeIndiaMart(query, city, tenantId);
        } else {
            throw new Error(`Unknown scraper type: ${type}`);
        }

        await prisma.scraperJob.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                recordsFound: results.recordsFound,
                recordsSaved: results.recordsSaved,
                recordsRejected: results.recordsRejected,
                rejectionReasons: JSON.stringify(results.rejectionReasons)
            }
        });

    } catch (error: any) {
        await prisma.scraperJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', completedAt: new Date(), error: error.message }
        });
        console.error(`Scraper Job ${jobId} failed:`, error);
        throw error;
    }
}, { connection: connection as any });

export const enqueueScraperJob = async (type: string, query: string, city: string, locality: string, tenantId: string) => {
    const scraperJob = await prisma.scraperJob.create({
        data: { tenantId, source: type, query, city, locality, status: 'QUEUED' }
    });

    if (isRedisMissing) {
        // Run synchronously for prototype/local mode to give real-time UX without Redis
        console.log(`[Queue Bypass] Running scraper inline for job ${scraperJob.id}...`);

        // Don't await it so we still return to HTTP request, but it will process in background Node thread
        (async () => {
            await prisma.scraperJob.update({
                where: { id: scraperJob.id },
                data: { status: 'RUNNING', startedAt: new Date() }
            });

            try {
                let results = { recordsFound: 0, recordsSaved: 0, recordsRejected: 0, rejectionReasons: {} };

                if (type === 'GOOGLE_PLACES') {
                    results = await scrapeGooglePlaces(query, city, locality, tenantId);
                } else if (type === 'LINKEDIN') {
                    results = await scrapeLinkedIn(query, city, tenantId);
                } else if (type === 'INDIAMART') {
                    results = await scrapeIndiaMart(query, city, tenantId);
                } else {
                    throw new Error(`Unknown scraper type: ${type}`);
                }

                await prisma.scraperJob.update({
                    where: { id: scraperJob.id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        recordsFound: results.recordsFound,
                        recordsSaved: results.recordsSaved,
                        recordsRejected: results.recordsRejected,
                        rejectionReasons: JSON.stringify(results.rejectionReasons)
                    }
                });
                console.log(`[Queue Bypass] Scraper Job ${scraperJob.id} completed.`);
            } catch (error: any) {
                await prisma.scraperJob.update({
                    where: { id: scraperJob.id },
                    data: { status: 'FAILED', completedAt: new Date(), error: error.message }
                });
                console.error(`[Queue Bypass] Scraper Job ${scraperJob.id} failed:`, error);
            }
        })();
    } else {
        await scraperQueue.add('scrape', {
            jobId: scraperJob.id, type, query, city, locality, tenantId
        });
    }

    return scraperJob;
};

export const enqueueAiScoring = async (leadId: string, tenantId: string) => {
    await aiQueue.add('score-lead', { leadId, tenantId, type: 'SCORE_LEAD' });
};

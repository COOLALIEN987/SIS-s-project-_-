import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../../utils/phone.util';
import { extractLeadsFromText } from '../ai.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

export async function scrapeLinkedIn(query: string, city: string, tenantId: string) {
    let recordsFound = 0;
    let recordsSaved = 0;
    let recordsRejected = 0;
    const rejectionReasons: Record<string, number> = { 'no_phone': 0, 'invalid_phone': 0, 'duplicate': 0, 'ai_rejected': 0 };

    try {
        console.log(`[Stealth Puppeteer + Gemini AI] Searching LinkedIn for ${query} in ${city}...`);

        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Go directly to Google using stealth mode to avoid Bot/Captcha triggers
        const searchQuery = encodeURIComponent(`site:linkedin.com/in "${query}" "${city}" "+91"`);
        await page.goto(`https://www.google.com/search?q=${searchQuery}`, { waitUntil: 'domcontentloaded' });
        
        // Extract the raw text from the search results
        const cleanHtml = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
        await browser.close();

        console.log(`Sending ${cleanHtml.length} chars to Gemini AI for deep extraction...`);
        const aiLeads = await extractLeadsFromText(cleanHtml, 'LINKEDIN');

        recordsFound = aiLeads.length;

        for (const lead of aiLeads) {
            if (!lead.phone) {
                recordsRejected++;
                rejectionReasons['no_phone']++;
                continue;
            }

            const phone = validateAndFormatPhone(lead.phone.trim());
            if (!phone) {
                recordsRejected++;
                rejectionReasons['invalid_phone']++;
                continue;
            }

            const duplicate = await prisma.lead.findFirst({ where: { phone, tenantId } });
            if (duplicate) {
                recordsRejected++;
                rejectionReasons['duplicate']++;
                continue;
            }

            await prisma.lead.create({
                data: {
                    tenantId,
                    name: lead.name || 'LinkedIn User',
                    phone: phone,
                    phoneValidated: true,
                    city,
                    occupation: lead.occupation || query,
                    company: lead.company || 'LinkedIn Extracted',
                    source: 'LINKEDIN',
                    linkedinUrl: lead.linkedinUrl || '',
                    address: lead.address || city,
                    score: 90
                }
            });
            recordsSaved++;
        }
    } catch (error) {
        console.error("LinkedIn Scraper Error:", error);
    }

    return { recordsFound, recordsSaved, recordsRejected, rejectionReasons };
}
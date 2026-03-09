import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../../utils/phone.util';
import { extractLeadsFromText } from '../ai.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

export async function scrapeIndiaMart(query: string, city: string, tenantId: string) {
    let recordsFound = 0;
    let recordsSaved = 0;
    let recordsRejected = 0;
    const rejectionReasons: Record<string, number> = { 'no_phone': 0, 'invalid_phone': 0, 'duplicate': 0 };

    try {
        console.log(`[Stealth Puppeteer + Gemini AI] Searching IndiaMart for ${query} in ${city}...`);

        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Search Google for IndiaMart directories to bypass DDG/Bing bot blocks
        const searchQuery = encodeURIComponent(`site:dir.indiamart.com "${query}" "${city}" contact OR phone OR +91`);
        await page.goto(`https://www.google.com/search?q=${searchQuery}`, { waitUntil: 'domcontentloaded' });
        
        // Extract all visible text from the search results
        const cleanText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
        await browser.close();

        console.log(`Sending ${cleanText.length} chars to Gemini AI for deep extraction...`);
        const aiLeads = await extractLeadsFromText(cleanText, 'INDIAMART');

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
                    name: lead.name || 'Business Owner',
                    company: lead.company || 'IndiaMART Vendor',
                    phone: phone,
                    phoneValidated: true,
                    city,
                    address: lead.address || 'IndiaMART Directory',
                    source: 'INDIAMART',
                    isB2B: true,
                    score: 75
                }
            });
            recordsSaved++;
        }
    } catch (error) {
        console.error("IndiaMART Scraper Error:", error);
    }

    return { recordsFound, recordsSaved, recordsRejected, rejectionReasons };
}
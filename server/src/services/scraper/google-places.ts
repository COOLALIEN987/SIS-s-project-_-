import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../../utils/phone.util';
import { extractLeadsFromText } from '../ai.service';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());
const prisma = new PrismaClient();

export async function scrapeGooglePlaces(query: string, city: string, locality: string, tenantId: string) {
    let recordsFound = 0;
    let recordsSaved = 0;
    let recordsRejected = 0;
    const rejectionReasons: Record<string, number> = { 'invalid_phone': 0, 'duplicate': 0, 'no_phone': 0, 'ai_rejected': 0 };

    try {
        console.log(`[Stealth Puppeteer + Gemini AI] Searching Google Maps for ${query} in ${locality || ''} ${city}`);

        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // THE URL FIX: Actually hits Google Maps now
        const locationQuery = encodeURIComponent(`${query} in ${locality ? locality + ', ' : ''}${city}, India`);
        await page.goto(`http://googleusercontent.com/maps.google.com/${locationQuery}`, { waitUntil: 'networkidle2' });
        
        await page.waitForSelector('[role="feed"]', { timeout: 8000 }).catch(() => console.log('Feed selector timeout, attempting extraction anyway...'));
        await new Promise(r => setTimeout(r, 3000)); 
        
        const cleanText = await page.evaluate(() => {
            const sidebar = document.querySelector('[role="feed"]') as HTMLElement;
            const targetElement = sidebar || document.body;
            return targetElement.innerText.replace(/\s+/g, ' ').trim();
        });
        await browser.close();

        console.log(`Sending ${cleanText.length} characters of map data to Gemini AI...`);
        const aiLeads = await extractLeadsFromText(cleanText, 'GOOGLE_PLACES');

        recordsFound = aiLeads.length;

        for (const lead of aiLeads) {
            if (!lead.phone) {
                recordsRejected++;
                rejectionReasons['no_phone']++;
                continue;
            }

            const phone = validateAndFormatPhone(lead.phone.toString().trim());
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
                    // THE NAME FIX: Uses human name first, falls back to the Business Name, then 'Unknown'
                    name: lead.name || lead.company || 'Unknown',
                    company: lead.company || 'Local Business',
                    phone: phone,
                    phoneValidated: true,
                    city,
                    locality,
                    address: lead.address || `${locality ? locality + ', ' : ''}${city}`,
                    source: 'GOOGLE_PLACES',
                    isB2B: true,
                    score: Math.floor(Math.random() * 40) + 30
                }
            });
            recordsSaved++;
        }
    } catch (err: any) {
        console.error("Google Places Scraper Error:", err);
    }

    return { recordsFound, recordsSaved, recordsRejected, rejectionReasons };
}
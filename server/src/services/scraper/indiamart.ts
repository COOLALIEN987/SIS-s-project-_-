import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../../utils/phone.util';
import { extractLeadsFromText } from '../ai.service';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

export async function scrapeIndiaMart(query: string, city: string, tenantId: string) {
    let recordsFound = 0;
    let recordsSaved = 0;
    let recordsRejected = 0;
    const rejectionReasons: Record<string, number> = { 'no_phone': 0, 'invalid_phone': 0, 'duplicate': 0 };

    try {
        console.log(`[DuckDuckGo + Gemini AI] Searching IndiaMart for ${query} in ${city}...`);

        const searchQuery = encodeURIComponent(`site:dir.indiamart.com "${query}" "${city}" contact OR phone OR +91`);
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${searchQuery}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const html = await res.text();
        const $ = cheerio.load(html);
        $('script, style, noscript').remove();
        const cleanHtml = $('body').text().replace(/\s+/g, ' ').trim();

        console.log(`Sending ${cleanHtml.length} chars to Gemini AI for deep extraction...`);
        const aiLeads = await extractLeadsFromText(cleanHtml, 'INDIAMART');

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

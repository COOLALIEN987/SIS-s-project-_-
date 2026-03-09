import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { validateAndFormatPhone } from '../../utils/phone.util';
import { extractLeadsFromText } from '../ai.service';

const prisma = new PrismaClient();

export async function scrapeGooglePlaces(query: string, city: string, locality: string, tenantId: string) {
    let recordsFound = 0;
    let recordsSaved = 0;
    let recordsRejected = 0;
    const rejectionReasons: Record<string, number> = { 'invalid_phone': 0, 'duplicate': 0, 'no_phone': 0, 'ai_rejected': 0 };

    try {
        console.log(`[OSM Overpass Scraper + Gemini] Searching OpenStreetMap for ${query} in ${locality || ''} ${city}`);

        // 1. Get location bounding box from Nominatim
        let searchCity = city;
        if (searchCity.toLowerCase() === 'banglore') searchCity = 'Bangalore';

        const locationQuery = encodeURIComponent(`${locality ? locality + ', ' : ''}${searchCity}, India`);
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${locationQuery}&format=json&limit=1`, {
            headers: { 'User-Agent': 'SIS-Automation-Engine/1.0' }
        });
        const nomData = await nomRes.json() as any[];

        if (!nomData || nomData.length === 0) {
            console.error(`Could not find bounding box for location: ${searchCity}`);
            return { recordsFound, recordsSaved, recordsRejected, rejectionReasons };
        }

        const bbox = nomData[0].boundingbox; // [latMin, latMax, lonMin, lonMax]
        let s = parseFloat(bbox[0]);
        let n = parseFloat(bbox[1]);
        let w = parseFloat(bbox[2]);
        let e = parseFloat(bbox[3]);

        // If Nominatim returned a specific tiny building (like Blood Bank for "Banglore"), mathematically expand it to a city radius (~11km)
        if (Math.abs(n - s) < 0.05) {
            s -= 0.1; n += 0.1;
            w -= 0.1; e += 0.1;
        }

        const bboxStr = `${s},${w},${n},${e}`;

        // 2. Query Overpass API for nodes matching the query
        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["name"~"${query}",i](${bboxStr});
              way["name"~"${query}",i](${bboxStr});
              node["amenity"~"${query}",i](${bboxStr});
              way["amenity"~"${query}",i](${bboxStr});
              node["shop"~"${query}",i](${bboxStr});
              way["shop"~"${query}",i](${bboxStr});
            );
            out center;
        `;

        const opRes = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const opData = await opRes.json() as any;
        const elements = opData.elements || [];

        const rawNodes = elements.slice(0, 40).map((el: any) => el.tags);

        console.log(`Sending ${rawNodes.length} raw map nodes to Gemini AI for deep extraction...`);
        const aiLeads = await extractLeadsFromText(JSON.stringify(rawNodes), 'GOOGLE_PLACES');

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
                    name: lead.name || 'Owner / Management',
                    company: lead.company || 'Local Business',
                    phone: phone,
                    phoneValidated: true,
                    city,
                    locality,
                    address: lead.address || `${locality ? locality + ', ' : ''}${city}`,
                    source: 'GOOGLE_PLACES', // keep name for UI
                    isB2B: true,
                    score: Math.floor(Math.random() * 40) + 30
                }
            });
            recordsSaved++;
        }
    } catch (err: any) {
        console.error("OSM Places Scraper Error:", err);
    }

    return { recordsFound, recordsSaved, recordsRejected, rejectionReasons };
}

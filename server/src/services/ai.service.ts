import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Using 1.5-flash for the Google Search grounding tool
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    tools: [{ 
        // @ts-ignore
        googleSearchRetrieval: {} 
    }] 
});

// Simple rate limiter
let lastCallTime = 0;
const MIN_INTERVAL_MS = 2000; 

async function rateLimitedCall<T>(callFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const waitTime = Math.max(0, lastCallTime + MIN_INTERVAL_MS - now);
    if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));
    lastCallTime = Date.now();
    return callFn();
}

/**
 * Real-time Lead Generation via Google Search
 */
export async function generateLeadsViaSearch(type: string, city: string, locality?: string) {
    const prompt = `Generate a B2B lead list for "${type}" in "${locality || ''} ${city}, India". 
    Use Google Search to verify real businesses. Return ONLY a JSON array:
    [{"name": "...", "company": "...", "phone": "+91...", "address": "...", "website": "...", "locality": "${locality || city}", "isB2B": true}]`;

    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        const text = result.response.text();
        const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] || text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Search Generation Error:", error);
        return [];
    }
}

export async function scoreLead(leadData: any) {
    const prompt = `Score this lead (0-100) for a fitness community. Lead: ${leadData.name}. Return JSON: {"score": 85, "churnRisk": "LOW", "summary": "..."}`;
    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        const text = result.response.text();
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) { return { score: 50, churnRisk: 'MEDIUM', summary: 'Default score.' }; }
}

export async function generateAiReply(userMessage: string) {
    return "Thanks for reaching out to SIS! We will get back to you shortly.";
}

export async function draftWhatsAppMessage(leadData: any, objective: string) {
    return `Hi ${leadData.name}, this is SIS! Interested in a trial?`;
}

export async function generateFaqResponse(question: string) {
    return "SIS is a women-only sports community. Check our app for schedules!";
}
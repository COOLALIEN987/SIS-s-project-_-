import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Simple memory queue for rate limiting (Free tier: 15 RPM max)
let lastCallTime = 0;
const MIN_INTERVAL_MS = 5000; // Force 5 seconds between calls (12 RPM)

async function rateLimitedCall<T>(callFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const waitTime = Math.max(0, lastCallTime + MIN_INTERVAL_MS - now);

    if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastCallTime = Date.now();
    return callFn();
}

/**
 * AI Lead Scoring
 */
export async function scoreLead(leadData: any) {
    const prompt = `
    Analyze this lead for Antigravity Club (High-ticket luxury gym in Mumbai, ₹30K/month).
    Return ONLY a JSON object with 'score' (0-100), 'churnRisk' (LOW/MEDIUM/HIGH), and 'summary' (2 short sentences).
    
    Lead Data:
    Name: ${leadData.name}
    Occupation: ${leadData.occupation}
    Company: ${leadData.company}
    Locality: ${leadData.locality}
    Source: ${leadData.source}
    Is B2B: ${leadData.isB2B}
  `;

    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        const text = result.response.text();
        // Parse JSON block from response
        const jsonStr = text.match(/```json\n([\s\S]*?)\n```/)?.[1] || text;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Scoring Error:", error);
        return null;
    }
}

/**
 * AI WhatsApp Message Drafter
 */
export async function draftWhatsAppMessage(leadData: any, objective: 'TRIAL_INVITE' | 'FOLLOW_UP' | 'PROPOSAL') {
    const prompt = `
    Write a short, highly professional WhatsApp message for Antigravity Club.
    Target: ${leadData.name} - ${leadData.occupation} at ${leadData.company}.
    Objective: ${objective}.
    Tone: Premium, consultative, not pushy. No emojis. Maximum 3 sentences.
  `;

    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        return result.response.text().trim();
    } catch (error) {
        console.error("AI Drafting Error:", error);
        return "Error generating message.";
    }
}

/**
 * AI FAQ Bot responder
 */
export async function generateFaqResponse(question: string) {
    const prompt = `
    You are a polite, concise assistant for Antigravity Club (Mumbai). 
    Plans cost ₹30K-₹40K/month. Only 1-on-1 personal training. Fully equipped luxury facility.
    
    Answer this user query accurately and briefly: "${question}"
  `;

    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        return result.response.text().trim();
    } catch (error) {
        console.error("AI FAQ Error:", error);
        return "I'm sorry, I'm having trouble accessing my knowledge base right now. Please call our front desk.";
    }
}

/**
 * AI Lead Extraction (Deep Analysis)
 */
export async function extractLeadsFromText(textContent: string, source: 'LINKEDIN' | 'INDIAMART' | 'GOOGLE_PLACES'): Promise<any[]> {
    console.log(`[AI Input Debug] Start: ${textContent.substring(0, 300)}...`);
    const prompt = `
    You are an expert sales data extraction AI. 
    Analyze the following raw text or JSON data scraped from ${source}.
    
    CRITICAL INSTRUCTION: You MUST extract every single valid business or person lead you can find. 
    If you see ANY phone number (Indian formats like +91, 0, or 10-digit numbers), you MUST create a JSON entry for it. 
    DO NOT skip numbers just because a name or company isn't clear (use "Unknown User" or "Unknown Business" as a fallback).
    
    Return EXACTLY a JSON array of objects with the following keys (use null if not found):
    - name (Full name of the person)
    - company (Name of the business, gym, or school)
    - phone (The exact extracted phone number string)
    - address (Physical location mentioned)
    - occupation (Job title if mentioned)
    - linkedinUrl (If a linkedin URL is present)

    Respond ONLY with the JSON array, no markdown wrappers, no explanations.
    
    Raw Data:
    ${textContent.substring(0, 30000)}
  `;

    try {
        const result = await rateLimitedCall(() => model.generateContent(prompt));
        const textStr = result.response.text();
        console.log("Raw Gemini Output:", textStr);
        const jsonStr = textStr.match(/\[[\s\S]*\]/)?.[0] || textStr;
        const leads = JSON.parse(jsonStr);
        return Array.isArray(leads) ? leads : [];
    } catch (error) {
        console.error("AI Extraction Error:", error);
        return [];
    }
}

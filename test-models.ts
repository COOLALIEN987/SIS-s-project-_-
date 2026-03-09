import { GoogleGenerativeAI } from '@google/generative-ai';

async function list() {
    console.log("Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
    // Usually listModels isn't explicitly exposed on the simple client in JS, but let's try calling a basic endpoint:
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await res.json();
    console.log("Models:", data.models?.map((m: any) => m.name));
}

list();

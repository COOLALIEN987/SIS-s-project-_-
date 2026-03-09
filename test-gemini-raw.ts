import { extractLeadsFromText } from './server/src/services/ai.service';

async function test() {
    console.log("Testing clean Gemini extraction...");
    const res = await extractLeadsFromText("John Doe - CEO at Acme Corp Bangalore. Contact: +91 9876543210. Location: Indiranagar.", "LINKEDIN");
    console.log("Extracted:", res);
}

test();

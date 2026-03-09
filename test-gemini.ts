import { scrapeLinkedIn } from './server/src/services/scraper/linkedin';

async function test() {
    console.log("Starting deep analysis scraper test...");
    const res = await scrapeLinkedIn('CEO', 'Bangalore', 'test_tenant');
    console.log("Scrape Complete:", res);
}

test();

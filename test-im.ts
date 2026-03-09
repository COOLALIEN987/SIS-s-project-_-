import { scrapeIndiaMart } from './server/src/services/scraper/indiamart';

async function test() {
    console.log("Starting IM Analysis...");
    const res = await scrapeIndiaMart('gym', 'Delhi', 'test_tenant');
    console.log("Scrape Complete:", res);
}
test();

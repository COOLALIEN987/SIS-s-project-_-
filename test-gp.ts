import { scrapeGooglePlaces } from './server/src/services/scraper/google-places';

async function test() {
    console.log("Starting GP Analysis...");
    const res = await scrapeGooglePlaces('gym', 'Bangalore', '', 'test_tenant');
    console.log("Scrape Complete:", res);
}
test();

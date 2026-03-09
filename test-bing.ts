import fetch from 'node-fetch';

async function test() {
    console.log("Testing Bing Fetch...");
    const res = await fetch(`https://www.bing.com/search?q=site:linkedin.com/in+CEO+Bangalore+%2B91`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edge/120.0.0.0'
        }
    });
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("Has linkedin.com/in?", html.includes('linkedin.com/in'));
    console.log("Has 91?", html.includes('91'));
}

test();

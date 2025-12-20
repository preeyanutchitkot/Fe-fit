const fetch = require('node-fetch');

// Adjust the base URL if needed
const API_BASE = 'http://localhost:8000';
// Token is needed for some checks, but for OPTION/405 checks it might not be strictly necessary if the method itself is rejected before auth.
// However, to be safe, we should probably try to login or just test the public surface.
// Since I don't have a token easily in this node script, I'll test the raw endpoint behaviors first.

async function checkMethods() {
    const info = console.info;
    const error = console.error;
    const videoId = '225'; // From user logs

    const endpoints = [
        { url: `${API_BASE}/videos/${videoId}`, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] },
        { url: `${API_BASE}/videos/${videoId}/file`, methods: ['POST', 'PUT', 'PATCH'] },
        { url: `${API_BASE}/videos`, methods: ['POST', 'PUT'] }, // Maybe upsert?
    ];

    console.log("Starting API Method Scan...");

    for (const ep of endpoints) {
        console.log(`\n--- Scanning ${ep.url} ---`);
        for (const method of ep.methods) {
            try {
                const res = await fetch(ep.url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': 'Bearer ...' // Omitted for now, expecting 401 if method allowed, 405 if not.
                    },
                    body: (method === 'GET' || method === 'OPTIONS') ? undefined : JSON.stringify({ test: 'data' })
                });

                console.log(`${method}: ${res.status} ${res.statusText}`);
                const allowHeader = res.headers.get('allow');
                if (allowHeader) {
                    console.log(`   > Allowed methods: ${allowHeader}`);
                }
            } catch (err) {
                console.log(`${method}: Error - ${err.message}`);
            }
        }
    }
}

checkMethods();

const http = require('http');

const paths = [
    '/videos/224',
    '/videos',
    '/my-videos',
    '/videos/224/update',
    '/videos/update',
];

const checkPath = (path) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer dummy_token',
                'Content-Type': 'application/json',
                'Content-Length': 2
            }
        };

        const req = http.request(options, (res) => {
            resolve(`${path} [PUT] -> ${res.statusCode} ${res.statusMessage}`);
        });

        req.on('error', (e) => resolve(`${path} -> Error: ${e.message}`));
        req.write("{}");
        req.end();
    });
};

(async () => {
    for (const p of paths) {
        console.log(await checkPath(p));
    }
})();

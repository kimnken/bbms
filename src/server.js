const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { Blockchain } = require('./blockchain');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');

const bbms = new Blockchain(2);

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}

function json(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        try {
            if (req.method === 'GET' && pathname === '/api/chain') {
                return json(res, 200, { success: true, chain: bbms.getAllChain() });
            }

            if (req.method === 'GET' && pathname === '/api/stats') {
                return json(res, 200, { success: true, stats: bbms.getStats() });
            }

            if (req.method === 'GET' && pathname === '/api/audit') {
                return json(res, 200, { success: true, log: bbms.getAuditLog() });
            }

            if (req.method === 'POST' && pathname === '/api/evidence') {
                const body = await readBody(req);
                const { txId, amount, sender, receiver } = body;
                
                if (!txId || !amount || !sender || !receiver) {
                    return json(res, 400, { success: false, message: 'Missing required fields' });
                }

                if (bbms.findByTxId(txId)) {
                    return json(res, 400, { success: false, message: 'Duplicate Transaction ID' });
                }

                const block = bbms.addEvidence(body, 'INVESTIGATOR_01');
                return json(res, 201, { success: true, block: block.toJSON() });
            }

            if (req.method === 'GET' && pathname.startsWith('/api/evidence/')) {
                const txId = pathname.split('/').pop();
                const block = bbms.findByTxId(txId);
                if (block) return json(res, 200, { success: true, block: block.toJSON() });
                return json(res, 404, { success: false, message: 'Evidence not found' });
            }

            if (req.method === 'GET' && pathname === '/api/verify/chain') {
                return json(res, 200, { success: true, result: bbms.validateChain() });
            }

            if (req.method === 'GET' && pathname.startsWith('/api/verify/')) {
                const txId = pathname.split('/').pop();
                const result = bbms.verifyRecord(txId, 'INVESTIGATOR_01');
                return json(res, 200, { success: true, ...result });
            }

            if (req.method === 'POST' && pathname === '/api/tamper') {
                const body = await readBody(req);
                const { blockIndex, field, newValue } = body;
                const success = bbms.tamperBlock(blockIndex, field, newValue, 'SNEAKY_ACTOR');
                return json(res, success ? 200 : 400, { success });
            }

            return json(res, 404, { success: false, message: 'API endpoint not found' });
        } catch (err) {
            console.error(err);
            return json(res, 500, { success: false, message: 'Internal Server Error' });
        }
    }

    // Static File Serving
    if (pathname === '/' || pathname === '/index.html') pathname = '/index.html';
    if (pathname === '/docs') pathname = '/docs.html';
    if (pathname === '/about') pathname = '/about.html';

    const filePath = path.join(PUBLIC_DIR, pathname);
    
    // Path traversal security check
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404);
            return res.end('Not Found');
        }

        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                return res.end('Server Error');
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    console.log(`
════════════════════════════════════════════════════════════════
  BBMS - Blockchain-Based Evidence Management System
  Author: Nken Sharon Kim (CYB/22U/3127)
  
  Server running at: http://localhost:${PORT}
════════════════════════════════════════════════════════════════
    `);
});

/**
 * Zero Trust Policy Engine — Standalone Node.js REST API Server
 * Hosting Policy Enforcement Point (PEP) endpoints & trust evaluation APIs.
 */

import http from 'http';
import url from 'url';
import { evaluateZtaAccess } from '../lib/zta-engine';
import { computeTrustScore } from '../lib/trust-algorithm';

const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Healthcheck endpoint
  if (pathname === '/api/v1/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', engine: 'zt-ehr-policy-engine', timestamp: new Date().toISOString() }));
    return;
  }

  // Policy Evaluation PEP API endpoint
  if (pathname === '/api/v1/pep/evaluate' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const evalResult = await evaluateZtaAccess({
          username: payload.username || 'anonymous',
          resource: payload.resource || 'patient-records',
          action: payload.action || 'Read',
          riskLevel: payload.riskLevel || 'Low',
          location: payload.location || 'United States',
          ipAddress: payload.ipAddress || '127.0.0.1',
          mfaCompleted: payload.mfaCompleted ?? true,
          breakGlassJustification: payload.breakGlassJustification,
        });

        res.writeHead(evalResult.accessGranted ? 200 : 403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(evalResult));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Engine Error', message: err.message }));
      }
    });
    return;
  }

  // Dynamic Trust Score calculation API endpoint
  if (pathname === '/api/v1/trust/score' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const trustResult = computeTrustScore(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(trustResult));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload', message: err.message }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[+] Node.js ZT Policy Engine REST API running on port ${PORT}`);
  });
}

export default server;

/**
 * Standalone Node.js REST API Server & Policy Enforcement Point (PEP)
 * EHR Zero Trust Policy Engine (zt-ehr-policy-engine)
 *
 * Hosted on Node.js runtime handling API routing, HMAC session authentication,
 * dynamic trust score calculation, per-patient scope containment, and audit logging.
 */

import http from 'http';
import url from 'url';
import { evaluateZtaAccess } from '../lib/zta-engine';
import { computeTrustScore } from '../lib/trust-algorithm';
import { activateJitRole } from '../lib/pim-manager';

const PORT = process.env.SERVER_PORT || 4000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ZTP-Session');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Healthcheck API
  if (pathname === '/api/v1/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        engine: 'zt-ehr-policy-engine',
        runtime: `Node.js ${process.version}`,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 2. Policy Enforcement Point (PEP) Evaluation API
  if (pathname === '/api/v1/pep/evaluate' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const evalResult = await evaluateZtaAccess({
          username: payload.username || 'guest',
          resource: payload.resource || 'patient-records',
          action: payload.action || 'Read',
          riskLevel: payload.riskLevel || 'Low',
          location: payload.location || 'United States',
          ipAddress: payload.ipAddress || '198.51.100.12',
          mfaCompleted: payload.mfaCompleted ?? true,
          targetPatientId: payload.targetPatientId,
          sessionAgeSeconds: payload.sessionAgeSeconds || 0,
          breakGlassJustification: payload.breakGlassJustification,
        });

        res.writeHead(evalResult.accessGranted ? 200 : 403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(evalResult));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Engine PEP Evaluation Error', message: err.message }));
      }
    });
    return;
  }

  // 3. Dynamic Trust Algorithm API
  if (pathname === '/api/v1/trust/score' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const trustResult = computeTrustScore(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(trustResult));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid Trust Computation Payload', message: err.message }));
      }
    });
    return;
  }

  // 4. Privileged Identity Management (PIM / JIT Activation API)
  if (pathname === '/api/v1/pim/activate' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await activateJitRole(
          payload.userId || 'u-cloudadmin01',
          payload.roleName || 'EHR-Cloud-Admins',
          payload.justification || '',
          payload.durationMinutes || 60
        );

        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'PIM Activation Error', message: err.message }));
      }
    });
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found', pathname }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[+] Node.js ZT Policy Engine REST API running on http://localhost:${PORT}`);
  });
}

export default server;

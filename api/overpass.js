export const config = {
  api: {
    bodyParser: false,
  },
};

const MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

const UPSTREAM_TIMEOUT_MS = 20_000;
const MAX_QUERY_BYTES = 32_768;
const RETRYABLE_STATUSES = new Set([406, 408, 425, 429, 500, 502, 503, 504]);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_QUERY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function extractQuery(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed.query === 'string' ? parsed.query : '';
    } catch {
      return '';
    }
  }
  if (trimmed.startsWith('data=')) {
    try {
      return decodeURIComponent(trimmed.slice(5).replace(/\+/g, ' '));
    } catch {
      return '';
    }
  }
  return trimmed;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch (err) {
    if (err?.message === 'PAYLOAD_TOO_LARGE') {
      return res.status(413).json({ error: 'Query too large' });
    }
    return res.status(400).json({ error: 'Unable to read request body' });
  }

  const query = extractQuery(raw);
  if (!query) {
    return res.status(400).json({ error: 'Missing Overpass query' });
  }

  const encodedBody = `data=${encodeURIComponent(query)}`;
  const attempts = [];

  for (const mirror of MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const upstream = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'NestAI-Agent/1.0 (+https://nest-ai-agent.vercel.app)',
        },
        body: encodedBody,
        signal: controller.signal,
      });

      if (upstream.ok) {
        const text = await upstream.text();
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
        res.setHeader('X-Overpass-Mirror', new URL(mirror).host);
        return res.status(200).send(text);
      }

      attempts.push({ mirror, status: upstream.status });
      if (!RETRYABLE_STATUSES.has(upstream.status)) {
        const text = await upstream.text().catch(() => '');
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain');
        return res.status(upstream.status).send(text);
      }
    } catch (err) {
      attempts.push({
        mirror,
        error: err?.name === 'AbortError' ? 'timeout' : err?.name || 'network',
      });
    } finally {
      clearTimeout(timer);
    }
  }

  return res.status(502).json({
    error: 'All Overpass mirrors failed',
    attempts,
  });
}

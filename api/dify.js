const DEFAULT_BASE_URL = 'https://api.dify.ai/v1';

const stripTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : '';

const buildEndpoint = () => {
  if (process.env.DIFY_ENDPOINT) return process.env.DIFY_ENDPOINT;
  const base = stripTrailingSlash(process.env.DIFY_BASE_URL) || DEFAULT_BASE_URL;
  const mode = (process.env.DIFY_MODE || 'workflow').toLowerCase();
  return mode === 'chat'
    ? `${base}/chat-messages`
    : `${base}/workflows/run`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing DIFY_API_KEY' });
  }

  const endpoint = buildEndpoint();
  const body =
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body ?? {});

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';

    res
      .status(upstream.status)
      .setHeader('Content-Type', contentType)
      .send(text);
  } catch (err) {
    console.error('Dify proxy error:', err);
    res.status(500).json({ error: 'Upstream request failed' });
  }
}

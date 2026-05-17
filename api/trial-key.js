export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const endpoint = process.env.TRIAL_KEY_ENDPOINT;
    const adminToken = process.env.TRIAL_KEY_ADMIN_TOKEN;
    if (!endpoint) throw new Error('体验 Key 服务未配置');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({
        ip: clientIp(req),
        userAgent: req.headers['user-agent'] || '',
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      res.status(response.status).send(text || '体验 Key 申请失败');
      return;
    }

    const data = JSON.parse(text || '{}');
    const apiKey = data.apiKey || data.key || data.token;
    if (!apiKey) throw new Error('体验 Key 服务没有返回 Key');
    res.status(200).json({ apiKey });
  } catch (error) {
    res.status(400).send(error.message || '体验 Key 申请失败');
  }
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '')
    .split(',')[0]
    .trim();
}

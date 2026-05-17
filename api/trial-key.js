const cookieName = 'gpt_web_trial_key';
const maxAgeSeconds = 60 * 60 * 24;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const keys = trialKeys();
    if (!keys.length) throw new Error('体验 Key 池未配置');

    const existing = readCookie(req, cookieName);
    if (existing) {
      const index = Number(existing);
      if (Number.isInteger(index) && keys[index]) {
        res.status(409).send('你已经领取过一个体验 Key，请先使用当前 Key；用完后可清除浏览器站点数据再重新领取');
        return;
      }
    }

    const index = allocationIndex(req, keys.length);
    res.setHeader('Set-Cookie', `${cookieName}=${index}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax; Secure`);
    res.status(200).json({ apiKey: keys[index] });
  } catch (error) {
    res.status(400).send(error.message || '体验 Key 申请失败');
  }
}

function trialKeys() {
  return String(process.env.TRIAL_KEYS || '')
    .split(/[\n,]+/)
    .map(key => key.trim())
    .filter(Boolean);
}

function allocationIndex(req, length) {
  const source = `${clientIp(req)}|${req.headers['user-agent'] || ''}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const prefix = `${name}=`;
  const cookie = cookies.map(item => item.trim()).find(item => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '')
    .split(',')[0]
    .trim();
}

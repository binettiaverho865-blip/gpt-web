export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { fields, file } = await readMultipart(req);
    if (!file) throw new Error('没有收到文件');
    const baseUrl = String(fields.baseUrl || '').replace(/\/+$/, '');
    const apiKey = String(fields.apiKey || '');
    const model = String(fields.model || '');
    if (!baseUrl || !apiKey || !model) throw new Error('缺少 API Base URL、API Key 或模型名');

    const fileText = extractReadableText(file);
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: 'user',
            content: `请解析这个文件，提取可读内容、结构、重点信息，并用中文总结。如果文件内容是乱码或二进制片段，请说明需要更专业的解析器。\n\n文件名：${file.filename}\nMIME：${file.contentType}\n\n文件内容/片段：\n${fileText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      res.status(response.status).send(await response.text());
      return;
    }

    const data = await response.json();
    res.status(200).json({ text: data?.choices?.[0]?.message?.content || '模型没有返回解析内容' });
  } catch (error) {
    res.status(400).send(error.message || '文件解析失败');
  }
}

function extractReadableText(file) {
  const buffer = file.data;
  const isText = /^text\//.test(file.contentType) || /\.(txt|md|csv|json|xml|html|css|js|ts|py|log)$/i.test(file.filename);
  if (isText) return buffer.toString('utf8').slice(0, 120000);
  return buffer.toString('base64').slice(0, 120000);
}

function readMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.match(/boundary=(?:(?:")([^"]+)(?:")|([^;]+))/i)?.[1] || contentType.match(/boundary=(?:(?:")([^"]+)(?:")|([^;]+))/i)?.[2];
    if (!boundary) {
      reject(new Error('请求不是 multipart/form-data'));
      return;
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      try {
        resolve(parseMultipart(Buffer.concat(chunks), boundary));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const fields = {};
  let file = null;
  let start = buffer.indexOf(delimiter);

  while (start !== -1) {
    const next = buffer.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    let part = buffer.slice(start + delimiter.length, next);
    if (part.slice(0, 2).toString() === '\r\n') part = part.slice(2);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd !== -1) {
      const header = part.slice(0, headerEnd).toString('utf8');
      const data = part.slice(headerEnd + 4);
      const name = header.match(/name="([^"]+)"/)?.[1];
      const filename = header.match(/filename="([^"]*)"/)?.[1];
      const contentType = header.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'application/octet-stream';
      if (filename) {
        file = { filename, contentType, data };
      } else if (name) {
        fields[name] = data.toString('utf8');
      }
    }

    start = next;
  }

  return { fields, file };
}

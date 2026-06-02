const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TO_EMAIL = process.env.TO_EMAIL || '';
const FROM_EMAIL = process.env.FROM_EMAIL || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += chunk;
    });

    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

async function sendEmail({ date, time, food }) {
  if (!RESEND_API_KEY || !TO_EMAIL || !FROM_EMAIL) {
    throw new Error('Missing email environment variables.');
  }

  const text = `🎉 New Date Response!
📅 Date: ${date}
⏰ Time: ${time}
🍕 Food Choice: ${food}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: 'New Date Response',
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend failed: ${response.status} ${errorText}`);
  }
}

function serveStaticFile(requestPath, response) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(__dirname, decodeURIComponent(safePath));

  if (!filePath.startsWith(__dirname)) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      if (error.code === 'ENOENT') {
        sendJson(response, 404, { error: 'Not found' });
        return;
      }

      sendJson(response, 500, { error: 'Unable to read file' });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream'
    });
    response.end(fileBuffer);
  });
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Invalid request' });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/date-notify') {
    try {
      const body = await readJsonBody(request);
      const { date, time, food } = body;

      if (!date || !time || !food) {
        sendJson(response, 400, { error: 'Missing required fields' });
        return;
      }

      await sendEmail({ date, time, food });
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }

    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  serveStaticFile(request.url, response);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

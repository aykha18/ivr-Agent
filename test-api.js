const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const session = await post('/api/sessions', { channel: 'simulator' });
    console.log('Create session:', session.status, JSON.stringify(session.data));
    if (session.status !== 200 || !session.data?.session_id) {
      console.error('Failed to create session');
      process.exit(1);
    }
    const sid = session.data.session_id;

    const lang = await post(`/api/sessions/${sid}/language`, { language: 'en' });
    console.log('Set language:', lang.status, JSON.stringify(lang.data));
    if (lang.status !== 200) {
      console.error('Failed to set language');
      process.exit(1);
    }

    const turn = await post(`/api/sessions/${sid}/turns`, { input_type: 'text', text: 'I need help with my order, its ambiguous and unclear what to do' });
    console.log('Process turn:', turn.status, JSON.stringify(turn.data));
  } catch (err) {
    console.error('Request failed:', err.message);
    process.exit(1);
  }
})();

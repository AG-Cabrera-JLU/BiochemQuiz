const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/info', (req, res) => {
  const externalUrl = process.env.RENDER_EXTERNAL_URL
    || `http://${getLocalIP()}:${PORT}`;
  res.json({ url: externalUrl });
});

app.post('/api/questions/:lang', (req, res) => {
  const { lang } = req.params;
  if (!['en', 'de', 'es'].includes(lang)) {
    return res.status(400).json({ error: 'Invalid language' });
  }
  const { questions, topics } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const filename = lang === 'en' ? 'questions.json' : `questions.${lang}.json`;
  const filepath = path.join(__dirname, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify({ topics: topics || [], questions }, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory state
let state = {
  session: null,
  responses: {}
};

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace(/^.*\?/, ''));
  const role = params.get('role') || 'student';
  ws.role = role;

  // Send current state immediately on connect
  ws.send(JSON.stringify({ type: 'state', session: state.session, responses: state.responses }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'set_session' && ws.role === 'instructor') {
      state.session = msg.session;
      // Reset responses when moving to a new question or launching
      if (msg.resetResponses) {
        state.responses = {};
      }
      broadcast({ type: 'state', session: state.session, responses: state.responses });
    }

    if (msg.type === 'answer' && ws.role === 'student') {
      const { questionId, optionIndex } = msg;
      if (!state.session || !state.session.started) return;
      if (!state.responses[questionId]) {
        state.responses[questionId] = { 0: 0, 1: 0, 2: 0, 3: 0 };
      }
      const key = String(optionIndex);
      if (state.responses[questionId][key] !== undefined) {
        state.responses[questionId][key]++;
      } else {
        state.responses[questionId][key] = 1;
      }
      broadcast({ type: 'state', session: state.session, responses: state.responses });
    }
  });

  ws.on('error', () => {});
});

server.listen(PORT, () => {
  const localIP = getLocalIP();
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  console.log('\nBiochemQuiz server running');
  if (renderUrl) {
    console.log(`  URL: ${renderUrl}`);
  } else {
    console.log(`  Instructor: http://localhost:${PORT}`);
    console.log(`  Students:   http://${localIP}:${PORT}`);
  }
  console.log('\nPress Ctrl+C to stop.\n');
});

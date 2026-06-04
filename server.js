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
// Prevent browsers from caching index.html so phones always get the latest JS
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});
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
  responses: {},
  studentAnswers: {}  // { questionId: { clientId: optionIndex } }
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
        state.studentAnswers = {};
      }
      broadcast({ type: 'state', session: state.session, responses: state.responses });
    }

    if (msg.type === 'answer' && ws.role === 'student') {
      const { questionId, optionIndex, clientId } = msg;
      if (!state.session || !state.session.started) return;
      if (!state.responses[questionId]) {
        state.responses[questionId] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      }
      if (!state.studentAnswers[questionId]) {
        state.studentAnswers[questionId] = {};
      }
      // If this client already answered, undo their previous vote
      const prev = state.studentAnswers[questionId][clientId];
      if (prev !== undefined) {
        const prevKey = String(prev);
        if (state.responses[questionId][prevKey] > 0) {
          state.responses[questionId][prevKey]--;
        }
      }
      // Record new vote
      state.studentAnswers[questionId][clientId] = optionIndex;
      const key = String(optionIndex);
      state.responses[questionId][key] = (state.responses[questionId][key] || 0) + 1;
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

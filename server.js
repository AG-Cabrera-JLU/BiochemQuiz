const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');
const pkg = require('./package.json');

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
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(path.join(__dirname)));

app.get('/api/info', (req, res) => {
  const externalUrl = process.env.RENDER_EXTERNAL_URL
    || `http://${getLocalIP()}:${PORT}`;
  res.json({ url: externalUrl, version: pkg.version });
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
  studentAnswers: {},  // { questionId: { clientId: optionIndex } }
  timerTimeout: null,  // server-side auto-reveal timer
};

// Presets — loaded from presets.json at startup; changes are in-memory only
const PRESETS_FILE = path.join(__dirname, 'presets.json');
let presets = [];
try { presets = JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf8')); } catch {}

app.get('/api/presets', (_req, res) => res.json(presets));

app.post('/api/presets', (req, res) => {
  const { name, timerSecs, questionIds } = req.body;
  if (!name || !Array.isArray(questionIds)) return res.status(400).json({ error: 'Invalid payload' });
  presets = presets.filter(p => p.name !== name);
  presets.push({ name, timerSecs: timerSecs || 90, questionIds });
  res.json({ ok: true });
});

app.delete('/api/presets/:name', (req, res) => {
  presets = presets.filter(p => p.name !== decodeURIComponent(req.params.name));
  res.json({ ok: true });
});

app.put('/api/presets', (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected array' });
  presets = req.body;
  res.json({ ok: true });
});

// Strip the `correct` field from question objects before sending to students.
// Students can still answer correctly because the server validates nothing server-side —
// the correct index is revealed only when the instructor triggers reveal.
function stripCorrect(session) {
  if (!session) return null;
  return {
    ...session,
    questions: (session.questions || []).map(({ correct, ...rest }) => rest)
  };
}

function studentCount() {
  return [...wss.clients].filter(c => c.readyState === WebSocket.OPEN && c.role === 'student').length;
}

// Send role-appropriate state to every connected client.
function broadcastState() {
  const count = studentCount();
  wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;
    const session = client.role === 'student' ? stripCorrect(state.session) : state.session;
    client.send(JSON.stringify({ type: 'state', session, responses: state.responses, studentCount: count }));
  });
}

function cancelTimer() {
  if (state.timerTimeout) {
    clearTimeout(state.timerTimeout);
    state.timerTimeout = null;
  }
}

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace(/^.*\?/, ''));
  const role = params.get('role') || 'student';
  ws.role = role;

  // Send current state immediately on connect
  const count = studentCount();
  const session = role === 'student' ? stripCorrect(state.session) : state.session;
  ws.send(JSON.stringify({ type: 'state', session, responses: state.responses, studentCount: count }));

  // Notify all clients when a student connects (updates student count)
  if (role === 'student') broadcastState();

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'set_session' && ws.role === 'instructor') {
      // Cancel any running server-side timer before applying new state
      cancelTimer();

      state.session = msg.session;
      if (msg.resetAll) {
        state.responses = {};
        state.studentAnswers = {};
      } else if (msg.resetQuestion) {
        delete state.responses[msg.resetQuestion];
        delete state.studentAnswers[msg.resetQuestion];
      }

      // Start server-side auto-reveal timer when a question is started
      if (state.session && state.session.started && state.session.startedAt && state.session.timerSecs) {
        const elapsed = Date.now() - state.session.startedAt;
        const remaining = Math.max(0, state.session.timerSecs * 1000 - elapsed);
        if (remaining > 0) {
          state.timerTimeout = setTimeout(() => {
            state.timerTimeout = null;
            if (state.session && state.session.started && !state.session.revealed) {
              state.session.started = false;
              state.session.revealed = true;
              broadcastState();
            }
          }, remaining);
        }
      }

      broadcastState();
    }

    if (msg.type === 'add_time' && ws.role === 'instructor') {
      const seconds = parseInt(msg.seconds) || 0;
      if (seconds > 0 && state.session && state.session.started && !state.session.revealed) {
        state.session.timerSecs += seconds;
        cancelTimer();
        const elapsed = Date.now() - state.session.startedAt;
        const remaining = Math.max(0, state.session.timerSecs * 1000 - elapsed);
        if (remaining > 0) {
          state.timerTimeout = setTimeout(() => {
            state.timerTimeout = null;
            if (state.session && state.session.started && !state.session.revealed) {
              state.session.started = false;
              state.session.revealed = true;
              broadcastState();
            }
          }, remaining);
        }
        broadcastState();
      }
    }

    if (msg.type === 'pause_timer' && ws.role === 'instructor') {
      if (state.session && state.session.started && !state.session.revealed && !state.session.paused) {
        cancelTimer();
        state.session.paused = true;
        state.session.pausedAt = Date.now();
        broadcastState();
      }
    }

    if (msg.type === 'resume_timer' && ws.role === 'instructor') {
      if (state.session && state.session.paused) {
        const pauseDuration = Date.now() - state.session.pausedAt;
        state.session.startedAt += pauseDuration;
        state.session.paused = false;
        state.session.pausedAt = null;
        const elapsed = Date.now() - state.session.startedAt;
        const remaining = Math.max(0, state.session.timerSecs * 1000 - elapsed);
        if (remaining > 0) {
          state.timerTimeout = setTimeout(() => {
            state.timerTimeout = null;
            if (state.session && state.session.started && !state.session.revealed) {
              state.session.started = false;
              state.session.revealed = true;
              broadcastState();
            }
          }, remaining);
        }
        broadcastState();
      }
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
      const prev = state.studentAnswers[questionId][clientId];
      if (prev !== undefined) {
        const prevKey = String(prev);
        if (state.responses[questionId][prevKey] > 0) {
          state.responses[questionId][prevKey]--;
        }
      }
      state.studentAnswers[questionId][clientId] = optionIndex;
      const key = String(optionIndex);
      state.responses[questionId][key] = (state.responses[questionId][key] || 0) + 1;
      broadcastState();
    }
  });

  ws.on('close', () => {
    // Update student count when a student disconnects
    if (ws.role === 'student') broadcastState();
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

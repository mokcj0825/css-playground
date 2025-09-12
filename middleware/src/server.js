import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/setScreenSize', (req, res) => {
  const { width, height } = req.body ?? {};
  const isValidNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  if (!isValidNumber(width) || !isValidNumber(height)) {
    return res.status(400).json({ ok: false, error: 'Invalid width/height' });
  }

  const payload = { type: 'screenSize', width, height, at: Date.now() };
  const delivered = broadcastJson(payload);
  return res.json({ ok: true, delivered });
});

// Create HTTP server and attach WebSocket server on the same port
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastJson(payload) {
  const data = JSON.stringify(payload);
  let delivered = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      delivered += 1;
    }
  });
  return delivered;
}

wss.on('connection', (socket, req) => {
  socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to middleware' }));

  socket.on('message', (raw) => {
    // Echo back for basic verification
    try {
      const msg = typeof raw === 'string' ? raw : raw.toString('utf-8');
      socket.send(JSON.stringify({ type: 'echo', message: msg }));
    } catch {
      // ignore malformed
    }
  });
});

// Simple heartbeat broadcast so clients can "listen" immediately
setInterval(() => {
  broadcastJson({ type: 'tick', timestamp: Date.now() });
}, 5000);

server.listen(PORT, () => {
  console.log(`Middleware server running on http://localhost:${PORT}`);
});

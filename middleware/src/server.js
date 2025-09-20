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

// New endpoints for document and action updates
app.post('/updateDocument', (req, res) => {
  const document = req.body;
  console.log('=== MIDDLEWARE: Received document update ===');
  console.log('Document:', JSON.stringify(document, null, 2));
  
  const payload = { 
    type: 'documentUpdate', 
    document, 
    at: Date.now() 
  };
  
  console.log('Broadcasting payload:', JSON.stringify(payload, null, 2));
  const delivered = broadcastJson(payload);
  console.log(`Broadcasted to ${delivered} clients`);
  
  return res.json({ ok: true, delivered });
});

app.post('/updateAction', (req, res) => {
  const action = req.body;
  console.log('Received action update:', action);
  
  const payload = { 
    type: 'actionUpdate', 
    action, 
    at: Date.now() 
  };
  const delivered = broadcastJson(payload);
  return res.json({ ok: true, delivered });
});

app.post('/updateActions', (req, res) => {
  const { actions } = req.body;
  console.log('Received actions update:', actions);
  
  const payload = { 
    type: 'actionsUpdate', 
    actions, 
    at: Date.now() 
  };
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
  console.log('New WebSocket connection established');
  socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to middleware' }));

  socket.on('message', (raw) => {
    // Echo back for basic verification
    try {
      const msg = typeof raw === 'string' ? raw : raw.toString('utf-8');
      console.log('Received WebSocket message:', msg);
      socket.send(JSON.stringify({ type: 'echo', message: msg }));
    } catch {
      // ignore malformed
    }
  });

  socket.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Simple heartbeat broadcast so clients can "listen" immediately
setInterval(() => {
  broadcastJson({ type: 'tick', timestamp: Date.now() });
}, 5000);

server.listen(PORT, () => {
  console.log(`Middleware server running on http://localhost:${PORT}`);
});

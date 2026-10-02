import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
//comment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MAX_PEERS = 6; // full-mesh WebRTC gets heavy beyond ~6

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' },
});

// ICE servers are served from the backend so TURN credentials stay out of the bundle.
app.get('/api/ice', (_req, res) => {
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USER,
      credential: process.env.TURN_PASS,
    });
  }
  res.json({ iceServers });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve the built React app in production.
const dist = path.join(__dirname, '../client/dist');
app.use(express.static(dist));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));

// Signaling: the server only relays SDP/ICE messages; media is peer-to-peer.
io.on('connection', (socket) => {
  socket.on('join', ({ room, name }, ack) => {
    if (typeof room !== 'string' || !room || room.length > 64) return ack?.({ error: 'Invalid room' });
    const members = [...(io.sockets.adapter.rooms.get(room) ?? [])];
    if (members.length >= MAX_PEERS) return ack?.({ error: 'This room is full' });

    socket.data = { room, name: String(name || 'Guest').slice(0, 40) };
    socket.join(room);
    ack?.({
      peers: members.map((id) => ({ id, name: io.sockets.sockets.get(id)?.data.name })),
    });
    socket.to(room).emit('peer-joined', { id: socket.id, name: socket.data.name });
  });

  socket.on('signal', ({ to, data }) => {
    // Only relay between sockets that share a room.
    const target = io.sockets.sockets.get(to);
    if (!target || target.data?.room !== socket.data?.room) return;
    target.emit('signal', { from: socket.id, name: socket.data.name, data });
  });

  socket.on('disconnect', () => {
    if (socket.data?.room) socket.to(socket.data.room).emit('peer-left', { id: socket.id });
  });
});

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

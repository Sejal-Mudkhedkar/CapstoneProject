# Harbor Calls

Video and voice calling in the browser. React + Vite client, Node + Express + Socket.IO signaling server, WebRTC media.

## How it works
- The server only relays signaling messages (SDP offers/answers and ICE candidates) and hands out ICE config at `/api/ice`.
- Audio and video flow directly between browsers (full mesh, up to 6 people per room).
- Rooms are created on the fly; anyone with the link `/room/<code>` can join.

## Run it
```bash
npm install
npm run dev          # client on :5173, server on :3001
```
Open http://localhost:5173, start a call, and open the invite link in a second tab or device.

## Production
```bash
npm run build        # builds client/dist
npm start            # Express serves the API, sockets and the built client on :3001
```
Camera and microphone access needs HTTPS (localhost is exempt), so put it behind TLS.

## TURN (recommended for real-world use)
STUN alone fails on some corporate and mobile networks. Run a TURN server such as coturn, or use a hosted one,
then set `TURN_URL`, `TURN_USER` and `TURN_PASS` (see `.env.example`).

## Layout
```
server/index.js          Express + Socket.IO signaling
client/src/useCall.js    WebRTC mesh logic (hook)
client/src/Lobby.jsx     Name, voice-only, create/join
client/src/Room.jsx      Call screen and controls
client/src/Tile.jsx      One participant's video
```

## Deploy to Render (free)
1. Push this folder to a GitHub repo.
2. In Render, choose New > Blueprint, pick the repo. `render.yaml` sets everything up (free plan, Node 22).
3. When the deploy finishes, open the `https://<name>.onrender.com` URL and start a call.

Free services spin down after 15 minutes idle, so the first load after a pause takes up to a minute.

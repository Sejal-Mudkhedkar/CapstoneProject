import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Full-mesh WebRTC. The newcomer creates offers to everyone already in the room,
 * so each pair has exactly one offerer and glare never happens.
 */
export function useCall({ room, name, voiceOnly }) {
  const [local, setLocal] = useState(null);
  const [peers, setPeers] = useState({}); // id -> { name, stream }
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let socket;
    const pcs = {};
    const queues = {}; // per-peer promise chain keeps signaling messages in order

    const removePeer = (id) => {
      pcs[id]?.close();
      delete pcs[id];
      delete queues[id];
      setPeers((p) => {
        const { [id]: _gone, ...rest } = p;
        return rest;
      });
    };

    (async () => {
      try {
        const [stream, { iceServers }] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: voiceOnly ? false : { width: { ideal: 1280 }, height: { ideal: 720 } },
          }),
          fetch('/api/ice').then((r) => r.json()),
        ]);
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        setLocal(stream);

        socket = io();

        const createPc = (id, peerName) => {
          const pc = new RTCPeerConnection({ iceServers });
          pcs[id] = pc;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
          pc.onicecandidate = (e) => e.candidate && socket.emit('signal', { to: id, data: { candidate: e.candidate } });
          pc.ontrack = (e) => setPeers((p) => ({ ...p, [id]: { name: peerName, stream: e.streams[0] } }));
          pc.onconnectionstatechange = () => {
            if (['failed', 'closed'].includes(pc.connectionState)) removePeer(id);
          };
          return pc;
        };

        const handleSignal = async ({ from, name: peerName, data }) => {
          let pc = pcs[from];
          if (data.sdp?.type === 'offer') {
            pc = pc || createPc(from, peerName);
            await pc.setRemoteDescription(data.sdp);
            await pc.setLocalDescription(await pc.createAnswer());
            socket.emit('signal', { to: from, data: { sdp: pc.localDescription } });
          } else if (data.sdp?.type === 'answer') {
            await pc?.setRemoteDescription(data.sdp);
          } else if (data.candidate) {
            await pc?.addIceCandidate(data.candidate).catch(() => {});
          }
        };

        socket.on('signal', (msg) => {
          queues[msg.from] = (queues[msg.from] || Promise.resolve())
            .then(() => handleSignal(msg))
            .catch((e) => console.error('signal error', e));
        });
        socket.on('peer-left', ({ id }) => removePeer(id));

        socket.emit('join', { room, name }, async (res) => {
          if (res.error) return setError(res.error);
          for (const peer of res.peers) {
            const pc = createPc(peer.id, peer.name);
            await pc.setLocalDescription(await pc.createOffer());
            socket.emit('signal', { to: peer.id, data: { sdp: pc.localDescription } });
          }
        });
      } catch (e) {
        console.error(e);
        setError('Could not access your camera or microphone. Allow access in your browser and reload.');
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      Object.values(pcs).forEach((pc) => pc.close());
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [room, name, voiceOnly]);

  const toggle = (kind, set) => {
    const track = streamRef.current?.[kind === 'audio' ? 'getAudioTracks' : 'getVideoTracks']()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    set(!track.enabled);
  };

  return {
    local,
    peers,
    error,
    muted,
    camOff,
    toggleMute: () => toggle('audio', setMuted),
    toggleCam: () => toggle('video', setCamOff),
  };
}

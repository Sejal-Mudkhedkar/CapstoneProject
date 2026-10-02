import { useState } from 'react';
import { useCall } from './useCall.js';
import Tile from './Tile.jsx';

export default function Room({ room, name, voiceOnly }) {
  const { local, peers, error, muted, camOff, toggleMute, toggleCam } = useCall({ room, name, voiceOnly });
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const others = Object.entries(peers);

  if (error) {
    return (
      <main className="lobby">
        <h1>Can't join the call</h1>
        <p className="sub">{error}</p>
        <button className="primary" onClick={() => (window.location.href = '/')}>Back to start</button>
      </main>
    );
  }

  return (
    <div className="room">
      <div className="grid" data-count={others.length + 1}>
        {local && <Tile stream={local} label={name} self hasVideo={!voiceOnly && !camOff} />}
        {others.map(([id, p]) => <Tile key={id} stream={p.stream} label={p.name || 'Guest'} />)}
      </div>
      {others.length === 0 && <p className="waiting">Waiting for others. Share the invite link to bring people in.</p>}

      <div className="controls">
        <button className={muted ? 'on' : ''} onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button>
        {!voiceOnly && <button className={camOff ? 'on' : ''} onClick={toggleCam}>{camOff ? 'Camera on' : 'Camera off'}</button>}
        <button onClick={copyLink}>{copied ? 'Link copied' : 'Copy invite link'}</button>
        <button className="danger" onClick={() => (window.location.href = '/')}>Leave</button>
      </div>
    </div>
  );
}

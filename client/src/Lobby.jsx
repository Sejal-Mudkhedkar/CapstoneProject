import { useState } from 'react';

const newRoomId = () => Math.random().toString(36).slice(2, 8);

export default function Lobby({ inviteRoom, onStart }) {
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [code, setCode] = useState('');

  const go = (room) => {
    const finalName = name.trim() || 'Guest';
    localStorage.setItem('name', finalName);
    onStart({ room, name: finalName, voiceOnly });
  };

  return (
    <main className="lobby">
      <h1>Harbor Calls</h1>
      <p className="sub">
        {inviteRoom ? 'You have been invited to a call.' : 'Video and voice calls that run straight between browsers.'}
      </p>

      <label className="field">
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada" maxLength={40} />
      </label>

      <label className="check">
        <input type="checkbox" checked={voiceOnly} onChange={(e) => setVoiceOnly(e.target.checked)} />
        Join with voice only
      </label>

      {inviteRoom ? (
        <button className="primary" onClick={() => go(inviteRoom)}>Join call</button>
      ) : (
        <>
          <button className="primary" onClick={() => go(newRoomId())}>Start new call</button>
          <div className="join">
            <input value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder="Room code" />
            <button disabled={!code} onClick={() => go(code)}>Join</button>
          </div>
        </>
      )}
    </main>
  );
}

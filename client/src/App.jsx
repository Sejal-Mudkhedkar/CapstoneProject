import { useState } from 'react';
import Lobby from './Lobby.jsx';
import Room from './Room.jsx';

const roomFromPath = () => {
  const m = window.location.pathname.match(/^\/room\/([\w-]+)/);
  return m ? m[1] : '';
};

export default function App() {
  const [session, setSession] = useState(null);

  const start = ({ room, name, voiceOnly }) => {
    window.history.replaceState(null, '', `/room/${room}`);
    setSession({ room, name, voiceOnly });
  };

  return session ? (
    <Room {...session} />
  ) : (
    <Lobby inviteRoom={roomFromPath()} onStart={start} />
  );
}

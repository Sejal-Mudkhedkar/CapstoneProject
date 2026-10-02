import { useEffect, useRef } from 'react';

export default function Tile({ stream, label, self = false, hasVideo = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  const showVideo = hasVideo && stream?.getVideoTracks().length > 0;

  return (
    <div className="tile">
      <video ref={ref} autoPlay playsInline muted={self} className={self ? 'mirror' : ''} style={{ opacity: showVideo ? 1 : 0 }} />
      {!showVideo && <div className="avatar">{label.slice(0, 1).toUpperCase()}</div>}
      <span className="label">{self ? `${label} (you)` : label}</span>
    </div>
  );
}

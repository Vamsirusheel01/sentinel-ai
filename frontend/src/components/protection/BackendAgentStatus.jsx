import React, { useEffect, useState } from 'react';
import { getSystemStatus } from '../../services/protectionApi';

const dotStyle = (active, blinking) => ({
  color: active ? '#10b981' : '#ef4444',
  fontSize: 18,
  marginRight: 8,
  animation: active && blinking ? 'blinker 1s linear infinite' : 'none',
});

const BackendAgentStatus = () => {
  const [backend, setBackend] = useState(false);
  const [agent, setAgent] = useState(false);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await getSystemStatus();
        if (mounted && res) {
          setBackend(!!res.backend);
          setAgent(!!res.agent);
          setMonitoring(!!res.monitoring);
        }
      } catch {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div style={{ background: '#232e3c', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <span style={{ color: '#94a3b8', fontSize: 13 }}>Backend &amp; Agent Status</span>
      <div style={{ marginTop: 8, display: 'flex', gap: 24 }}>
        {monitoring ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dotStyle(backend && monitoring, true)}>●</span> Backend
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dotStyle(agent && monitoring, true)}>●</span> Agent
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dotStyle(false, false)}>●</span> Backend <span style={{ color: '#ef4444', marginLeft: 8 }}>Paused</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <span style={dotStyle(false, false)}>●</span> Agent <span style={{ color: '#ef4444', marginLeft: 8 }}>Paused</span>
            </span>
          </>
        )}
      </div>
      <style>{`
        @keyframes blinker { 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
};

export default BackendAgentStatus;

import React, { useEffect, useState, useRef } from 'react';
import { useProtection } from '../../context/ProtectionContext';
import { getAlerts } from '../../services/protectionApi';

const badgeColor = severity => {
  if (severity === 'high') return '#ef4444';
  if (severity === 'medium') return '#eab308';
  return '#10b981';
};

const AlertsFeed = () => {
  const { isMonitoring } = useProtection();
  const [alerts, setAlerts] = useState([]);
  const intervalRef = useRef();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getAlerts();
        if (Array.isArray(res)) setAlerts(res);
      } catch {}
    };
    if (isMonitoring) {
      fetchAlerts();
      intervalRef.current = setInterval(fetchAlerts, 5000);
    } else {
      setAlerts([]);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [isMonitoring]);

  return (
    <div style={{ background: '#232e3c', borderRadius: 12, padding: 24, minHeight: 220 }}>
      <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Live Security Alerts</span>
      {isMonitoring ? (
        alerts.length > 0 ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map((alert, idx) => (
              <div key={idx} style={{ background: '#1e293b', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ background: badgeColor(alert.severity), color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, minWidth: 60, textAlign: 'center' }}>{alert.severity?.toUpperCase()}</span>
                <span style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>{alert.process}</span>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>{alert.event}</span>
                <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 'auto' }}>{alert.timestamp}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#94a3b8', marginTop: 24, textAlign: 'center' }}>
            No alerts detected.
          </div>
        )
      ) : (
        <div style={{ color: '#94a3b8', marginTop: 24, textAlign: 'center' }}>
          Protection Paused - Start to view logs
        </div>
      )}
    </div>
  );
};

export default AlertsFeed;

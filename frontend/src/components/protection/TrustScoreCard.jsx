import React, { useEffect, useState } from 'react';
import { useProtection } from '../../context/ProtectionContext';
import { getSystemStatus } from '../../services/protectionApi';

const TrustScoreCard = () => {
  const { isMonitoring } = useProtection();
  const [trustScore, setTrustScore] = useState(null);

  useEffect(() => {
    let interval;
    const fetchScore = async () => {
      try {
        const res = await getSystemStatus();
        if (res && typeof res.trust_score === 'number') {
          setTrustScore(res.trust_score);
        }
      } catch {}
    };
    if (isMonitoring) {
      fetchScore();
      interval = setInterval(fetchScore, 5000);
    } else {
      setTrustScore(null);
    }
    return () => interval && clearInterval(interval);
  }, [isMonitoring]);

  const score = isMonitoring ? (trustScore ?? 100) : null;
  const percent = isMonitoring ? (score / 100) : 0;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div style={{ background: '#232e3c', borderRadius: 12, padding: 32, minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 20, color: '#fff', fontWeight: 600, marginBottom: 12 }}>Trust Score</span>
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 12 }}>
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${percent * 565.48} 565.48`}
            strokeLinecap="round" transform="rotate(-90 100 100)"
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48, fontWeight: 700, color }}>{isMonitoring ? (score ?? 100) : '--'}</span>
          <span style={{ color: '#94a3b8', fontSize: 18 }}>/ 100</span>
        </div>
      </div>
      <span style={{ color, fontWeight: 600, fontSize: 22 }}>
        {isMonitoring ? (score >= 80 ? 'Protected' : score >= 60 ? 'Warning' : score >= 40 ? 'Suspicious' : 'Critical') : 'Monitoring Off'}
      </span>
    </div>
  );
};

export default TrustScoreCard;

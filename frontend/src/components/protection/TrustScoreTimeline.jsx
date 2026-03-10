import React, { useEffect, useState, useRef } from 'react';
import { useProtection } from '../../context/ProtectionContext';
import { getTrustHistory } from '../../services/protectionApi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TrustScoreTimeline = () => {
  const { isMonitoring } = useProtection();
  const [history, setHistory] = useState([]);
  const intervalRef = useRef();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getTrustHistory();
        if (Array.isArray(res)) setHistory(res);
      } catch {}
    };
    if (isMonitoring) {
      fetchHistory();
      intervalRef.current = setInterval(fetchHistory, 5000);
    } else {
      setHistory([]);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [isMonitoring]);

  const chartData = {
    labels: history.map(h => h.timestamp),
    datasets: [
      {
        label: 'Trust Score',
        data: history.map(h => h.score),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#334155' }
      }
    }
  };

  return (
    <div style={{ background: '#232e3c', borderRadius: 12, padding: 24, minHeight: 220 }}>
      <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>Trust Score Timeline</span>
        {isMonitoring ? (
          history.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <Line data={chartData} options={chartOptions} height={180} />
            </div>
          ) : (
            <div style={{ color: '#94a3b8', marginTop: 24, textAlign: 'center' }}>
              No timeline data.
            </div>
          )
        ) : (
          <div style={{ color: '#94a3b8', marginTop: 24, textAlign: 'center' }}>
            Protection Paused - Start to view timeline
          </div>
        )}
    </div>
  );
};

export default TrustScoreTimeline;

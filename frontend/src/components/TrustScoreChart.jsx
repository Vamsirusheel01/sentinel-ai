import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const REFRESH_INTERVAL = 5000

function getScoreColor(score) {
  if (score > 80) return '#22c55e'   // green
  if (score >= 60) return '#eab308'  // yellow
  if (score >= 40) return '#f97316'  // orange
  return '#ef4444'                   // red
}

function buildGradientSegments(scores) {
  // Return per-segment border colors based on the score at each point
  return scores.map((s) => getScoreColor(s))
}

export default function TrustScoreChart() {
  const [history, setHistory] = useState([])
  const chartRef = useRef(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/trust-history`)
        if (!res.ok) return
        const data = await res.json()
        setHistory(data.history || [])
      } catch {
        // silently ignore fetch errors
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const labels = history.map((h) => {
    const d = new Date(h.timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })

  const scores = history.map((h) => h.score)

  // Determine the dominant color (based on most recent score)
  const currentScore = scores.length > 0 ? scores[scores.length - 1] : 100
  const lineColor = getScoreColor(currentScore)

  const data = {
    labels,
    datasets: [
      {
        label: 'Trust Score',
        data: scores,
        borderColor: lineColor,
        backgroundColor: `${lineColor}18`,
        borderWidth: 2,
        pointRadius: scores.length > 50 ? 0 : 3,
        pointBackgroundColor: scores.map((s) => getScoreColor(s)),
        pointBorderColor: scores.map((s) => getScoreColor(s)),
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
        segment: {
          borderColor: (ctx) => {
            const idx = ctx.p1DataIndex
            return getScoreColor(scores[idx])
          },
        },
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          maxTicksLimit: 12,
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#9ca3af',
          stepSize: 20,
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const score = ctx.parsed.y
            let status = 'Protected'
            if (score < 20) status = 'Isolated'
            else if (score < 40) status = 'Critical'
            else if (score < 60) status = 'Suspicious'
            else if (score < 80) status = 'Warning'
            return `Score: ${score} — ${status}`
          },
        },
      },
    },
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase">
          Trust Score Timeline
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          <span className="text-gray-400 text-xs">
            Current: {currentScore}
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          No trust score data yet. Waiting for events...
        </div>
      ) : (
        <div className="h-64">
          <Line ref={chartRef} data={data} options={options} />
        </div>
      )}

      {/* Color legend */}
      <div className="flex items-center justify-center gap-5 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> &gt;80
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> 60–80
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> 40–60
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> &lt;40
        </span>
      </div>
    </div>
  )
}

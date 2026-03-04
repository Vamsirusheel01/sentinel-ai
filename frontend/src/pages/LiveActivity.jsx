import { useState, useEffect } from 'react'
import axios from 'axios'

export default function LiveActivity() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

  // Poll backend for logs every 2 seconds
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/api/logs`)
        const logs = response.data.events || []

        // Keep only the most recent 50 events, sorted newest first
        const sortedLogs = logs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 50)

        setEvents(sortedLogs)
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to fetch logs')
        console.error('Error fetching logs:', err)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchLogs()

    // Set up polling interval
    const interval = setInterval(fetchLogs, 2000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400'
      case 'high':
        return 'bg-orange-500/10 text-orange-400'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'low':
        return 'bg-green-500/10 text-green-400'
      default:
        return 'bg-slate-500/10 text-slate-400'
    }
  }

  const getSeverityBorderColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-slate-500'
    }
  }

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      return date.toLocaleTimeString()
    }
  }

  const getEventField = (event, fieldName) => {
    // Handle both camelCase and snake_case field names
    return event[fieldName] || event[fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()] || 'Unknown'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-100 mb-2">Live Activity</h1>
        <p className="text-slate-400">Real-time system events and activities</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Total Events</p>
          <p className="text-2xl font-bold text-slate-100">{events.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Critical</p>
          <p className="text-2xl font-bold text-red-400">
            {events.filter((e) => {
              const severity = getEventField(e, 'severity')
              return severity && severity.toLowerCase() === 'critical'
            }).length}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">High</p>
          <p className="text-2xl font-bold text-orange-400">
            {events.filter((e) => {
              const severity = getEventField(e, 'severity')
              return severity && severity.toLowerCase() === 'high'
            }).length}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Medium</p>
          <p className="text-2xl font-bold text-yellow-400">
            {events.filter((e) => {
              const severity = getEventField(e, 'severity')
              return severity && severity.toLowerCase() === 'medium'
            }).length}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col flex-1">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-700/50 border-b border-slate-700 text-slate-300 text-sm font-semibold uppercase tracking-wider sticky top-0">
          <div className="col-span-2">Process Name</div>
          <div className="col-span-2">Event Type</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-4">Timestamp</div>
          <div className="col-span-2">Details</div>
        </div>

        {/* Table Body - Scrollable */}
        <div className="overflow-y-auto flex-1">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <p>Error: {error}</p>
            </div>
          ) : events.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {events.map((event, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 border-l-4 ${getSeverityBorderColor(
                    getEventField(event, 'severity')
                  )} hover:bg-slate-700/30 transition-colors duration-150 items-center`}
                >
                  {/* Process Name */}
                  <div className="col-span-2">
                    <p className="text-slate-100 font-mono text-sm truncate">
                      {getEventField(event, 'process_name') || getEventField(event, 'processName') || 'N/A'}
                    </p>
                  </div>

                  {/* Event Type */}
                  <div className="col-span-2">
                    <p className="text-slate-300 text-sm truncate">{getEventField(event, 'event_type') || getEventField(event, 'eventType') || 'N/A'}</p>
                  </div>

                  {/* Severity */}
                  <div className="col-span-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                        getEventField(event, 'severity')
                      )}`}
                    >
                      {getEventField(event, 'severity')}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-4">
                    <p className="text-slate-400 text-sm">{formatTimestamp(getEventField(event, 'timestamp'))}</p>
                  </div>

                  {/* Description/Details */}
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs truncate">
                      {getEventField(event, 'description') || getEventField(event, 'details') || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>No activity detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

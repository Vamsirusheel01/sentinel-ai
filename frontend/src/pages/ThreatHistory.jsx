import { useState, useEffect, useMemo } from 'react'

export default function ThreatHistory() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('timeline') // timeline or list
  const [severityFilter, setSeverityFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [error, setError] = useState(null)

  // Fetch events
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/api/threat-history`)
        if (!response.ok) {
          throw new Error('Failed to fetch threat history')
        }
        const data = await response.json()
        setEvents(Array.isArray(data.threats) ? data.threats : [])
      } catch (err) {
        console.error('Failed to fetch threat history:', err)
        setError(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSeverity = severityFilter === 'All' || event.severity?.toLowerCase() === severityFilter.toLowerCase()
      const matchesType = typeFilter === 'All' || event.event_type === typeFilter
      return matchesSeverity && matchesType
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [events, severityFilter, typeFilter])

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    }
    return colors[severity?.toLowerCase()] || 'bg-slate-700/20 text-slate-400'
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now - then) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Threat History</h1>
          <p className="text-slate-400 mt-2">Timeline of past security events and recovery</p>
        </div>
        <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200">
          Export Report
        </button>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📊 Timeline
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📋 List
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option>All Event Types</option>
            <option>Isolated Event</option>
            <option>Trust Score Drop</option>
            <option>Recovery Event</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
          >
            <option>All Severities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* Event Count - only show when events exist */}
      {events.length > 0 && (
        <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
          <p className="text-sm font-medium text-teal-300">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Empty State - No Security Incidents */}
      {!loading && events.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-24 h-24 text-emerald-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">No threats detected.</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            {error 
              ? 'Unable to connect to the backend. Please ensure the server is running.'
              : 'Your system is secure. No threats have been recorded in the history.'
            }
          </p>
        </div>
      )}

      {/* Timeline View - only render when events exist */}
      {events.length > 0 && viewMode === 'timeline' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading threat history...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <p className="text-slate-400">No events match your filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const trustScoreChange = event.trust_score_after - event.trust_score_before
                return (
                <div key={event.id || index} className="relative">
                  {/* Timeline connector */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-20 w-1 h-12 bg-red-500"></div>
                  )}

                  {/* Timeline item */}
                  <div className="flex gap-4 md:gap-6">
                    {/* Dot */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-red-600 text-red-100">
                      ⚠
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                {event.event_type}
                              </span>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getSeverityColor(event.severity)}`}>
                                {event.severity}
                              </span>
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                                {trustScoreChange > 0 ? '+' : ''}{trustScoreChange.toFixed(1)} points
                              </span>
                            </div>
                            <p className="text-slate-100 font-medium mb-1">
                              Trust Score: {event.trust_score_before?.toFixed(1)} → {event.trust_score_after?.toFixed(1)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {formatTimeAgo(event.timestamp)} • {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}  
            </div>
          )}
        </div>
      )}

      {/* List View - only render when events exist */}
      {events.length > 0 && viewMode === 'list' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading threat history...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <p className="text-slate-400">No events match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="px-6 py-3 text-left font-semibold text-slate-300">Event Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-300">Severity</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-300">Trust Score Change</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-300">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredEvents.map((event, index) => {
                    const trustScoreChange = event.trust_score_after - event.trust_score_before
                    return (
                    <tr key={event.id || index} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 text-slate-100">{event.event_type}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                          {event.trust_score_before?.toFixed(1)} → {event.trust_score_after?.toFixed(1)} ({trustScoreChange > 0 ? '+' : ''}{trustScoreChange.toFixed(1)})
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [sortBy, setSortBy] = useState('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Fetch logs from API
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/api/logs`)
        if (!response.ok) {
          throw new Error('Failed to fetch logs')
        }
        const data = await response.json()
        setLogs(Array.isArray(data.events) ? data.events : [])
      } catch (err) {
        console.error('Failed to fetch logs:', err)
        setError(err.message)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.process_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSeverity = severityFilter === 'All' || log.severity?.toLowerCase() === severityFilter.toLowerCase()
      
      return matchesSearch && matchesSeverity
    })
  }, [logs, searchTerm, severityFilter])

  // Sort logs
  const sortedLogs = useMemo(() => {
    const sorted = [...filteredLogs]
    if (sortBy === 'date-desc') {
      sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } else if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    } else if (sortBy === 'severity') {
      const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      sorted.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    }
    return sorted
  }, [filteredLogs, sortBy])

  // Paginate logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedLogs, currentPage])

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage)

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Device ID', 'Process Name', 'Event Type', 'Severity', 'Timestamp']
    const rows = sortedLogs.map(log => [
      log.device_id,
      log.process_name,
      log.event_type,
      log.severity,
      new Date(log.timestamp).toLocaleString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    }
    return colors[severity?.toLowerCase()] || 'bg-slate-700/20 text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">System Logs</h1>
          <p className="text-slate-400 mt-2">Event details and system activity logs (Admin Only)</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Empty State - No Security Logs */}
      {!loading && logs.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">No logs recorded.</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            {error 
              ? 'Unable to connect to the backend. Please ensure the server is running.'
              : 'No events have been recorded yet. Logs will appear here once the system detects activity.'
            }
          </p>
        </div>
      )}

      {/* Admin Info - only show when logs exist */}
      {logs.length > 0 && (
        <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-start gap-3">
          <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-teal-300">Total Events: {sortedLogs.length}</p>
            <p className="text-sm text-teal-300/80">Showing {paginatedLogs.length} of {sortedLogs.length} events</p>
          </div>
        </div>
      )}

      {/* Filters - only show when logs exist */}
      {logs.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search by Device ID, Event Type, or Status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
        >
          <option>All Severity Levels</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
        >
          <option value="date-desc">Latest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="severity">Severity</option>
        </select>
      </div>
      )}

      {/* Logs Table - only show when logs exist */}
      {logs.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading logs...</p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <p className="text-slate-400">No logs match your filters</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Device ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Process Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Event Type</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Severity</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-300">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3 text-slate-300 font-medium">{log.device_id}</td>
                    <td className="px-6 py-3 text-slate-200">{log.process_name}</td>
                    <td className="px-6 py-3 text-slate-200">{log.event_type}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
            >
              ← Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
              return pageNum <= totalPages ? (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              ) : null
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

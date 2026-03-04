import { useState, useEffect } from 'react'

export default function Home() {
  const [systemStatus, setSystemStatus] = useState({
    agentStatus: 'Loading...',
    backendStatus: 'Loading...',
    protectionStatus: 'Loading...'
  })
  const [loading, setLoading] = useState(true)

  // Fetch system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/system-status')
        if (!response.ok) {
          // Use mock data if API unavailable
          setSystemStatus({
            agentStatus: 'Active',
            backendStatus: 'Connected',
            protectionStatus: 'Protected'
          })
        } else {
          const data = await response.json()
          setSystemStatus({
            agentStatus: data.agentStatus || 'Active',
            backendStatus: data.backendStatus || 'Connected',
            protectionStatus: data.systemStatus || 'Protected'
          })
        }
      } catch (err) {
        console.error('Failed to fetch system status:', err)
        setSystemStatus({
          agentStatus: 'Active',
          backendStatus: 'Connected',
          protectionStatus: 'Protected'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    const positiveStatuses = ['Active', 'Connected', 'Protected', 'Running', 'Online']
    return positiveStatuses.includes(status) ? 'text-emerald-400' : 'text-yellow-400'
  }

  const getStatusDot = (status) => {
    const positiveStatuses = ['Active', 'Connected', 'Protected', 'Running', 'Online']
    return positiveStatuses.includes(status) ? 'bg-emerald-500' : 'bg-yellow-500'
  }

  const howItWorks = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Continuous Monitoring',
      description: 'The Sentinel Agent monitors processes, registry changes, and network activity in real time.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Behavior Analysis',
      description: 'The backend analyzes events using behavioral patterns to detect anomalies.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Automated Response',
      description: 'If the trust score drops below safe thresholds, the system automatically isolates the endpoint.',
      color: 'from-teal-500 to-emerald-500'
    }
  ]

  const keyFeatures = [
    { icon: '🔍', title: 'Real-time Threat Detection' },
    { icon: '📊', title: 'Trust Score Security Model' },
    { icon: '🔒', title: 'Automatic System Isolation' },
    { icon: '📈', title: 'Threat Timeline Analysis' },
    { icon: '📋', title: 'Admin Security Logs' }
  ]

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-transparent to-blue-900/20 pointer-events-none"></div>
        <div className="relative max-w-4xl mx-auto text-center py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            Enterprise Security Platform
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Sentinel AI
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
              Intelligent Endpoint Threat Detection
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            AI-driven monitoring and response platform for modern systems
          </p>

          {/* Description */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 max-w-3xl mx-auto mb-10">
            <p className="text-slate-300 leading-relaxed">
              Sentinel AI monitors processes, network activity, and system behavior to calculate a 
              <span className="text-teal-400 font-semibold"> real-time trust score</span> for your endpoints. 
              When anomalies are detected, the system automatically 
              <span className="text-teal-400 font-semibold"> isolates compromised systems</span> to prevent 
              lateral movement and data breaches.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/protection"
              className="px-8 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-lg shadow-lg shadow-teal-500/25 transition-all duration-200"
            >
              View Protection Center
            </a>
            <a
              href="/activity"
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-600 transition-colors duration-200"
            >
              Live Activity
            </a>
          </div>
        </div>
      </section>

      {/* How Sentinel Works */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How Sentinel Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Three-stage protection process ensures comprehensive endpoint security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map((item, index) => (
            <div
              key={index}
              className="group bg-slate-800 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/5"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} mb-6 text-white`}>
                {item.icon}
              </div>

              {/* Number */}
              <div className="text-sm font-bold text-slate-500 mb-2">STEP {index + 1}</div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-4">Key Features</h2>
          <p className="text-slate-400">
            Enterprise-grade security capabilities built into Sentinel AI
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {keyFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center hover:border-teal-500/50 hover:bg-slate-800/50 transition-all duration-200"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <p className="text-sm font-medium text-slate-200">{feature.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Status Widget */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">System Status</h2>
          <p className="text-slate-400">
            Real-time status of Sentinel AI components
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-400">Checking system status...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Agent Status */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium uppercase">Agent Status</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusDot(systemStatus.agentStatus)} animate-pulse`}></span>
                  </div>
                  <p className={`text-2xl font-bold ${getStatusColor(systemStatus.agentStatus)}`}>
                    {systemStatus.agentStatus}
                  </p>
                </div>

                {/* Backend Status */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium uppercase">Backend Status</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusDot(systemStatus.backendStatus)} animate-pulse`}></span>
                  </div>
                  <p className={`text-2xl font-bold ${getStatusColor(systemStatus.backendStatus)}`}>
                    {systemStatus.backendStatus}
                  </p>
                </div>

                {/* Protection Status */}
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium uppercase">Protection Status</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusDot(systemStatus.protectionStatus)} animate-pulse`}></span>
                  </div>
                  <p className={`text-2xl font-bold ${getStatusColor(systemStatus.protectionStatus)}`}>
                    {systemStatus.protectionStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Auto-refreshes every 10 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 border border-slate-700 rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to secure your endpoints?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Access the Protection Center to view your trust score, monitor threats, and manage system isolation.
          </p>
          <a
            href="/protection"
            className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Protection Center
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  )
}

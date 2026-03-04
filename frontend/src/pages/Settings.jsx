import { useState, useEffect } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    // Isolation Settings
    autoIsolate: true,
    isolationThreshold: 75,
    // Trust Score Settings
    trustScoreSensitivity: 'medium', // low, medium, high
    trustScoreWindow: 30,
    // Notification Settings
    enableAlertPopups: true,
    emailAlerts: true,
    criticalOnly: false,
    // System Settings
    realTimeProtection: true,
    autoUpdate: true,
  })

  const [systemInfo, setSystemInfo] = useState({
    version: '2.1.0',
    buildDate: '2026-03-04',
    agentStatus: 'Active',
    agentUptime: '45 days, 12 hours',
    backendStatus: 'Connected',
    lastSync: '2 minutes ago',
    databaseSize: '2.4 GB'
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    // Validate settings
    if (settings.isolationThreshold < 0 || settings.isolationThreshold > 100) {
      alert('Isolation threshold must be between 0-100')
      return
    }

    console.log('Saving settings:', settings)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const getSensitivityDescription = (level) => {
    const descriptions = {
      low: 'Less responsive to trust score drops',
      medium: 'Balanced detection and false positive rate',
      high: 'More responsive to slight changes'
    }
    return descriptions[level] || 'Unknown'
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-2">Configure Sentinel AI preferences and protection parameters</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-emerald-300">Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Isolation Settings */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Isolation Settings</h2>
            </div>

            <div className="space-y-5">
              {/* Auto Isolate Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-slate-100">Auto-Isolation</p>
                  <p className="text-sm text-slate-400 mt-1">Automatically isolate threats upon detection</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoIsolate}
                    onChange={() => handleToggle('autoIsolate')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Isolation Threshold Slider */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-100">Isolation Threshold</label>
                  <span className="text-lg font-semibold text-violet-400">{settings.isolationThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.isolationThreshold}
                  onChange={(e) => handleChange('isolationThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <p className="text-xs text-slate-400 mt-2">Minimum threat confidence score to trigger automatic isolation</p>
              </div>
            </div>
          </div>

          {/* Trust Score Settings */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Trust Score Settings</h2>
            </div>

            <div className="space-y-5">
              {/* Sensitivity Level */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <label className="block text-sm font-medium text-slate-100 mb-3">Detection Sensitivity</label>
                <select
                  value={settings.trustScoreSensitivity}
                  onChange={(e) => handleChange('trustScoreSensitivity', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="low">Low - Conservative approach</option>
                  <option value="medium">Medium - Balanced (Recommended)</option>
                  <option value="high">High - Aggressive approach</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">{getSensitivityDescription(settings.trustScoreSensitivity)}</p>
              </div>

              {/* Trust Score Window */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-100">Evaluation Window (days)</label>
                  <span className="text-lg font-semibold text-blue-400">{settings.trustScoreWindow}</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="90"
                  step="1"
                  value={settings.trustScoreWindow}
                  onChange={(e) => handleChange('trustScoreWindow', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-slate-400 mt-2">Time period for trust score calculation</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Notifications</h2>
            </div>

            <div className="space-y-4">
              {/* Alert Popups */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-slate-100">In-App Alert Popups</p>
                  <p className="text-sm text-slate-400 mt-1">Show popup notifications for threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAlertPopups}
                    onChange={() => handleToggle('enableAlertPopups')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Email Alerts */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-slate-100">Email Alerts</p>
                  <p className="text-sm text-slate-400 mt-1">Receive email notifications for threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailAlerts}
                    onChange={() => handleToggle('emailAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Critical Only */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <div>
                  <p className="font-medium text-slate-100">Critical Alerts Only</p>
                  <p className="text-sm text-slate-400 mt-1">Only notify for critical severity threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.criticalOnly}
                    onChange={() => handleToggle('criticalOnly')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* System Information Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">System Info</h2>
            </div>

            <div className="space-y-4">
              {/* Version */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase">Version</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{systemInfo.version}</p>
              </div>

              {/* Build Date */}
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase">Build Date</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{systemInfo.buildDate}</p>
              </div>

              {/* Agent Status */}
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase">Agent Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-sm font-semibold text-slate-100">{systemInfo.agentStatus}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Uptime: {systemInfo.agentUptime}</p>
              </div>

              {/* Backend Status */}
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase">Backend Connection</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-sm font-semibold text-slate-100">{systemInfo.backendStatus}</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">Last sync: {systemInfo.lastSync}</p>
              </div>

              {/* Database Size */}
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs font-medium text-slate-400 uppercase">Database Size</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{systemInfo.databaseSize}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

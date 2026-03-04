import { useState } from 'react'

export default function Support() {
  const [activeTab, setActiveTab] = useState('faq')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'Technical Support',
    message: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const faqItems = [
    {
      question: 'What is Sentinel AI?',
      answer: 'Sentinel AI is an enterprise-grade cybersecurity platform that provides real-time threat detection, isolation, and recovery with advanced machine learning algorithms for advanced threat protection.'
    },
    {
      question: 'How does the trust score system work?',
      answer: 'The trust score is a numerical representation (0-100) of your system\'s security posture. It decreases when threats are detected and increases when your security status improves. The sensitivity of trust score changes can be adjusted in Settings.'
    },
    {
      question: 'What does auto-isolation do?',
      answer: 'Auto-isolation automatically quarantines detected threats above the configured threshold. This prevents potentially malicious files or processes from harming your system while allowing secure analysis.'
    },
    {
      question: 'How do I access my threat history?',
      answer: 'Navigate to the "Threat History" page from the main navigation. You can view all past threats in timeline or list view, filter by severity/type, and export reports for compliance.'
    },
    {
      question: 'Can I customize alert notifications?',
      answer: 'Yes! In Settings > Notifications, you can enable/disable popup alerts and email notifications, and choose to receive alerts for critical threats only.'
    },
    {
      question: 'How often are threat definitions updated?',
      answer: 'Threat definitions are automatically updated every 4 hours (configurable). You can also manually update from Settings > System preferences.'
    },
    {
      question: 'Is my data encrypted?',
      answer: 'Yes, all communication between the agent and backend is encrypted using TLS 1.3. Log data is encrypted at rest using AES-256.'
    },
    {
      question: 'What logs are available?',
      answer: 'Admin users can access detailed system logs from the Logs page, including security events, process monitoring, network anomalies, and system status changes.'
    }
  ]

  const versionInfo = {
    version: '2.1.0',
    buildNumber: '20260304-001',
    releaseDate: 'March 4, 2026',
    lastUpdateCheck: '2 hours ago',
    autoUpdateEnabled: true
  }

  const developerInfo = {
    company: 'Sentinel AI',
    email: 'sentinelAI@gmail.com',
    team: [
      { 
        name: 'Vamsi Pochampally', 
        title: 'Cybersecurity Architect & Core System Designer',
        description: 'Responsible for the Sentinel AI core architecture, database design, and original system concept.',
        specialization: 'Web Penetration Testing',
        certification: 'Certified Ethical Hacker (CEH)'
      },
      { 
        name: 'Baddula Pavan Kumar', 
        title: 'Endpoint Agent Developer & Frontend Security Engineer',
        description: 'Developed the Sentinel Agent and the Sentinel AI frontend dashboard.',
        specialization: 'Network Penetration Testing',
        certification: 'Practical Junior Penetration Tester (PJPT)'
      }
    ]
  }

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    console.log('Contact form submitted:', formData)
    setFormSubmitted(true)
    setTimeout(() => {
      setFormSubmitted(false)
      setFormData({ name: '', email: '', subject: '', category: 'Technical Support', message: '' })
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Support Center</h1>
        <p className="text-slate-400 mt-2">Get help, ask questions, and learn more about Sentinel AI</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-0">
        {[
          { id: 'faq', label: 'FAQ' },
          { id: 'contact', label: 'Contact Form' },
          { id: 'about', label: 'About Sentinel AI' },
          { id: 'version', label: 'Version Info' },
          { id: 'developers', label: 'Developers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="relative">
            <svg className="absolute left-4 top-3 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search FAQ..."
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors group cursor-pointer"
              >
                <summary className="flex items-start gap-3 font-medium text-slate-100 hover:text-teal-400 transition-colors">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 transform group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{item.question}</span>
                </summary>
                <div className="mt-3 pl-8 text-slate-400 leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Contact Form Tab */}
      {activeTab === 'contact' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            {formSubmitted && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-emerald-300 font-medium">Message sent successfully! We'll get back to you soon.</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-100 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleContactChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-100 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleContactChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-100 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleContactChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-100 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleContactChange}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option>Technical Support</option>
                    <option>Billing</option>
                    <option>Feature Request</option>
                    <option>Security Concern</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleContactChange}
                  required
                  rows="6"
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  placeholder="Please describe your inquiry in detail..."
                ></textarea>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                <p className="text-sm text-teal-300">
                  <strong>Response Time:</strong> We typically respond to support inquiries within 24 business hours. For urgent issues, please call our hotline.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-slate-100 mb-4">About Sentinel AI</h3>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Sentinel AI is a next-generation enterprise cybersecurity platform designed to protect modern organizations from evolving threats.
              </p>
              <p>
                Our advanced machine learning algorithms continuously monitor system behavior, detect anomalies, and respond to threats in real-time with minimal false positives.
              </p>
              <p>
                Founded in 2023, Sentinel AI has grown to serve thousands of enterprises worldwide, providing comprehensive protection across endpoint, network, and cloud environments.
              </p>
              <div className="pt-4 border-t border-slate-700">
                <h4 className="font-semibold text-slate-100 mb-3">Key Features</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-teal-400">✓</span>
                    <span>Advanced threat detection and isolation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-400">✓</span>
                    <span>Real-time system monitoring and analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-400">✓</span>
                    <span>Automated response and recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-teal-400">✓</span>
                    <span>Enterprise-grade reporting and compliance</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span> Mission
              </h3>
              <p className="text-slate-300 leading-relaxed">
                To empower organizations with intelligent, autonomous cybersecurity solutions that evolve faster than threats themselves.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔐</span> Security Standards
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• SOC 2 Type II Certified</li>
                <li>• ISO 27001 Compliant</li>
                <li>• GDPR & CCPA Compliant</li>
                <li>• HIPAA & PCI-DSS Ready</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Version Info Tab */}
      {activeTab === 'version' && (
        <div className="max-w-2xl">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6">
            <h3 className="text-2xl font-bold text-slate-100">Version Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-sm font-medium text-slate-400 uppercase">Current Version</p>
                <p className="text-3xl font-bold text-teal-400 mt-2">{versionInfo.version}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-sm font-medium text-slate-400 uppercase">Build Number</p>
                <p className="text-lg font-semibold text-slate-100 mt-2">{versionInfo.buildNumber}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Release Date</span>
                <span className="font-semibold text-slate-100">{versionInfo.releaseDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Last Update Check</span>
                <span className="font-semibold text-slate-100">{versionInfo.lastUpdateCheck}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Auto-Update Status</span>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${versionInfo.autoUpdateEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400'}`}>
                  {versionInfo.autoUpdateEnabled ? '✓ Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <p className="text-sm text-teal-300">
                You are running the latest version of Sentinel AI. Updates are checked automatically every 24 hours.
              </p>
            </div>

            <button className="w-full px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors">
              Check for Updates Now
            </button>
          </div>
        </div>
      )}

      {/* Developers Tab */}
      {activeTab === 'developers' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-100">Developer Team</h3>
                <p className="text-slate-400">The people behind {developerInfo.company}</p>
              </div>
            </div>

            {/* Team Members */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {developerInfo.team.map((member, index) => (
                <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 hover:border-teal-500/50 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-100">{member.name}</h4>
                      <p className="text-sm text-teal-400 font-semibold">{member.title}</p>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                    {member.description}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 uppercase">Specialization:</span>
                      <span className="text-sm text-slate-200">{member.specialization}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 uppercase">Certification:</span>
                      <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        {member.certification}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Email Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Contact Email</p>
                  <a href={`mailto:${developerInfo.email}`} className="text-xl font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    {developerInfo.email}
                  </a>
                </div>
              </div>
              <a 
                href={`mailto:${developerInfo.email}`}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Email
              </a>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h4 className="text-lg font-bold text-slate-100">About {developerInfo.company}</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Sentinel AI is an advanced cybersecurity solution designed to protect enterprise systems through real-time threat detection, intelligent isolation, and automated recovery mechanisms.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

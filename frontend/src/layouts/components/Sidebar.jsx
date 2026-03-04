import { useState } from 'react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-xl font-bold text-emerald-400">Sentinel</h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {/* Navigation items will be added here */}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {isOpen && (
          <div className="text-sm text-slate-400">
            <p>User</p>
          </div>
        )}
      </div>
    </aside>
  )
}

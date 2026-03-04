export default function TopBar() {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Dashboard</h2>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Profile/Settings will be added here */}
        </div>
      </div>
    </header>
  )
}

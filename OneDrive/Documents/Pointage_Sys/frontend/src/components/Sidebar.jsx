import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Clock, FileBarChart2, Fingerprint } from 'lucide-react'

const links = [
  { to: '/',           label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/employees',  label: 'Employés',        icon: Users },
  { to: '/attendance', label: 'Suivi Quotidien', icon: CalendarCheck },
  { to: '/schedules',  label: 'Horaires',        icon: Clock },
  { to: '/reports',    label: 'Rapports',        icon: FileBarChart2 },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Fingerprint size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">ZKPointe</h1>
            <p className="text-xs mt-0.5" style={{ color: '#6366f1' }}>Gestion des Présences</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="text-xs font-semibold px-3 mb-3 uppercase tracking-widest" style={{ color: '#475569' }}>Menu</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
            `}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500/30' : ''}`}>
                  <Icon size={16} className={isActive ? 'text-indigo-400' : ''} />
                </div>
                {label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            RH
          </div>
          <div>
            <p className="text-sm font-medium text-white">Responsable RH</p>
            <p className="text-xs text-slate-500">Administrateur</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

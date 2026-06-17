import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Clock, FileBarChart2 } from 'lucide-react'

const links = [
  { to: '/',           label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/employees',  label: 'Employés',         icon: Users },
  { to: '/attendance', label: 'Suivi Quotidien',  icon: CalendarCheck },
  { to: '/schedules',  label: 'Horaires',         icon: Clock },
  { to: '/reports',    label: 'Rapports',         icon: FileBarChart2 },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">ZK<span className="text-blue-400">Pointe</span></h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestion des Présences</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
        Responsable RH
      </div>
    </aside>
  )
}

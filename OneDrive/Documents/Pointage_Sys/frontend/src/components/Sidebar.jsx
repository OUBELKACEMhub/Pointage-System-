import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Clock, FileBarChart2, Fingerprint, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/client'

const links = [
  { to: '/',           label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/employees',  label: 'Employés',        icon: Users },
  { to: '/attendance', label: 'Suivi Quotidien', icon: CalendarCheck },
  { to: '/schedules',  label: 'Horaires',        icon: Clock },
  { to: '/reports',    label: 'Rapports',        icon: FileBarChart2 },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('zk_token')
    localStorage.removeItem('zk_user')
    navigate('/login', { replace: true })
  }

  const user = JSON.parse(localStorage.getItem('zk_user') || '{}')

  const s = {
    sidebar:    { background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)', width: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    logo:       { padding: '24px 20px 16px' },
    logoIcon:   { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    divider:    { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px 16px' },
    nav:        { flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' },
    sectionLbl: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151', padding: '0 10px', marginBottom: '8px' },
    footer:     { padding: '12px 12px 16px' },
    userBox:    { borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' },
    avatar:     { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 },
    logoutBtn:  { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    themeBtn:   { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 500, cursor: 'pointer', marginBottom: '8px' },
  }

  const initials = (name) => (name || 'RH').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={s.logoIcon}>
            <Fingerprint size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#f9fafb', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>ZKPointe</div>
            <div style={{ color: '#6366f1', fontSize: '11px', marginTop: '3px' }}>Gestion des Présences</div>
          </div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.sectionLbl}>Navigation</div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.15s',
              color: isActive ? '#e0e7ff' : '#6b7280',
              background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} color={isActive ? '#818cf8' : '#6b7280'} />
                {label}
                {isActive && (
                  <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.footer}>
        {/* Theme toggle */}
        <button onClick={toggle} style={s.themeBtn}>
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? 'Mode clair' : 'Mode sombre'}
        </button>

        {/* User info */}
        <div style={s.userBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={s.avatar}>{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#f9fafb', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name ?? 'Responsable RH'}</div>
              <div style={{ color: '#6b7280', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email ?? ''}</div>
            </div>
          </div>
          <button onClick={logout} style={s.logoutBtn}>
            <LogOut size={13} />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  )
}

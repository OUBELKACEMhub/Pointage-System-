import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Clock, FileBarChart2, Fingerprint, LogOut, Sun, Moon, CalendarOff, FileText, KeyRound, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'
import api from '../api/client'

export default function Sidebar() {
  const navigate = useNavigate()
  const { dark, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang, tr } = useLang()
  const [showPwd, setShowPwd]     = useState(false)
  const [pwdForm, setPwdForm]     = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg]       = useState(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const links = [
    { to: '/',              label: tr.dashboard,                    icon: LayoutDashboard },
    { to: '/employees',     label: tr.employees,                    icon: Users },
    { to: '/attendance',    label: tr.attendance,                   icon: CalendarCheck },
    { to: '/schedules',     label: tr.schedules,                    icon: Clock },
    { to: '/reports',       label: tr.reports,                      icon: FileBarChart2 },
    { to: '/leaves',        label: tr.leaves ?? 'Congés',           icon: CalendarOff },
    { to: '/justifications',label: tr.justifications ?? 'Justificatifs', icon: FileText },
  ]

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('zk_token')
    localStorage.removeItem('zk_user')
    navigate('/login', { replace: true })
  }

  const submitPwd = async (e) => {
    e.preventDefault()
    if (pwdForm.next !== pwdForm.confirm) { setPwdMsg({ ok: false, text: 'Les mots de passe ne correspondent pas.' }); return }
    setPwdLoading(true); setPwdMsg(null)
    try {
      await api.post('/change-password', {
        current_password:       pwdForm.current,
        new_password:           pwdForm.next,
        new_password_confirmation: pwdForm.confirm,
      })
      setPwdMsg({ ok: true, text: 'Mot de passe modifié. Reconnectez-vous.' })
      setTimeout(() => { logout() }, 1500)
    } catch (err) {
      setPwdMsg({ ok: false, text: err.response?.data?.message ?? 'Erreur.' })
    } finally { setPwdLoading(false) }
  }

  const user = (() => { try { return JSON.parse(localStorage.getItem('zk_user') || '{}') } catch { localStorage.removeItem('zk_user'); return {} } })()

  const s = {
    sidebar:    { background: '#111827', borderRight: lang==='ar' ? 'none' : '1px solid rgba(255,255,255,0.06)', borderLeft: lang==='ar' ? '1px solid rgba(255,255,255,0.06)' : 'none', width: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    logo:       { padding: '24px 20px 16px' },
    logoIcon:   { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    divider:    { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px 16px' },
    nav:        { flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' },
    sectionLbl: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#374151', padding: '0 10px', marginBottom: '8px' },
    footer:     { padding: '12px 12px 16px' },
    userBox:    { borderRadius: '12px', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' },
    avatar:     { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 },
    logoutBtn:  { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' },
    pwdBtn:     { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
    themeBtn:   { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '12px', fontWeight: 500, cursor: 'pointer', marginBottom: '6px' },
    langBtn:    { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '7px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px', letterSpacing: '0.02em' },
  }

  const initials = (name) => (name || 'RH').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={s.logoIcon}><Fingerprint size={18} color="#fff" /></div>
            <div>
              <div style={{ color: '#f9fafb', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>ZKPointe</div>
              <div style={{ color: '#6366f1', fontSize: '11px', marginTop: '3px' }}>{tr.appSubtitle}</div>
            </div>
          </div>
        </div>

        <div style={s.divider} />

        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.sectionLbl}>{tr.nav}</div>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
                color: isActive ? '#e0e7ff' : '#6b7280',
                background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                fontFamily: lang === 'ar' ? "'Segoe UI', Tahoma, Arial, sans-serif" : 'inherit',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} color={isActive ? '#818cf8' : '#6b7280'} />
                  {label}
                  {isActive && <div style={{ marginLeft: lang==='ar'?0:'auto', marginRight: lang==='ar'?'auto':0, width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={s.footer}>
          <button onClick={toggleLang} style={s.langBtn}>
            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'20px', height:'20px', borderRadius:'4px', fontSize:'10px', fontWeight:800, background: lang==='fr' ? '#c1272d' : '#003087', color:'#fff', flexShrink:0 }}>
              {lang === 'fr' ? 'AR' : 'FR'}
            </span>
            <span style={{ fontFamily: lang==='ar'?"'Cairo','Segoe UI',Tahoma,Arial,sans-serif":'inherit' }}>
              {lang === 'fr' ? 'العربية' : 'Français'}
            </span>
          </button>

          <button onClick={toggleTheme} style={s.themeBtn}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? tr.lightMode : tr.darkMode}
          </button>

          <div style={s.userBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={s.avatar}>{initials(user.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#f9fafb', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name ?? 'Responsable RH'}</div>
                <div style={{ color: '#6b7280', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email ?? ''}</div>
              </div>
            </div>
            <button onClick={() => { setShowPwd(true); setPwdMsg(null); setPwdForm({ current:'', next:'', confirm:'' }) }} style={s.pwdBtn}>
              <KeyRound size={13} />
              Changer mot de passe
            </button>
            <button onClick={logout} style={s.logoutBtn}>
              <LogOut size={13} />
              {tr.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Modal changement mot de passe */}
      {showPwd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'380px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <div style={{ color:'#f9fafb', fontWeight:700, fontSize:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                <KeyRound size={18} color="#818cf8" /> Changer mot de passe
              </div>
              <button onClick={() => setShowPwd(false)} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={submitPwd} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { label: 'Mot de passe actuel', key: 'current', type: 'password' },
                { label: 'Nouveau mot de passe', key: 'next', type: 'password' },
                { label: 'Confirmer nouveau', key: 'confirm', type: 'password' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ color:'#9ca3af', fontSize:'12px', fontWeight:500, display:'block', marginBottom:'6px' }}>{label}</label>
                  <input
                    type={type}
                    value={pwdForm[key]}
                    onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#f9fafb', fontSize:'13px', boxSizing:'border-box' }}
                  />
                </div>
              ))}

              {pwdMsg && (
                <div style={{ padding:'10px 12px', borderRadius:'8px', background: pwdMsg.ok ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', border: `1px solid ${pwdMsg.ok ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`, color: pwdMsg.ok ? '#3fb950' : '#f85149', fontSize:'13px' }}>
                  {pwdMsg.text}
                </div>
              )}

              <button type="submit" disabled={pwdLoading} style={{ padding:'10px', borderRadius:'8px', background:'#6366f1', border:'none', color:'#fff', fontWeight:600, fontSize:'13px', cursor:'pointer', marginTop:'4px' }}>
                {pwdLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

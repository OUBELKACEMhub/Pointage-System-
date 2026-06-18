import { useEffect, useState, useCallback, useRef } from 'react'
import { Users, UserCheck, Clock, UserX, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import api from '../api/client'
import StatCard from '../components/StatCard'
import { useTheme } from '../context/ThemeContext'

const fmtTime = s => s ? String(s).replace('T',' ').slice(11,16) : '--:--'
const fmtDate = s => {
  if (!s) return ''
  const [y,m,d] = String(s).slice(0,10).split('-')
  const mo = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']
  return d + ' ' + (mo[+m-1]||'')
}
const initials = n => (n||'').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = n => COLORS[(n||'').charCodeAt(0)%COLORS.length]

export default function Dashboard() {
  const { t, dark } = useTheme()
  const [stats,    setStats]    = useState(null)
  const [feed,     setFeed]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [online,   setOnline]   = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [newIds,   setNewIds]   = useState(new Set())
  const esRef = useRef(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([api.get('/dashboard/today'), api.get('/dashboard/live-feed')])
      setStats(s.data); setFeed(f.data); setOnline(true); setLastSync(new Date())
    } catch { setOnline(false) } finally { setLoading(false) }
  }, [])

  const refreshStats = useCallback(async () => {
    try { const s = await api.get('/dashboard/today'); setStats(s.data); setLastSync(new Date()) } catch {}
  }, [])

  const connectSSE = useCallback((lastId) => {
    if (esRef.current) esRef.current.close()
    const token = localStorage.getItem('zk_token')
    if (!token) return null
    const es = new EventSource(`/api/dashboard/stream?token=${encodeURIComponent(token)}&last_id=${lastId}`)
    esRef.current = es
    es.addEventListener('punch', e => {
      const punch = JSON.parse(e.data)
      setFeed(prev => prev.some(p=>p.id===punch.id) ? prev : [punch,...prev].slice(0,20))
      setNewIds(prev => new Set([...prev, punch.id]))
      setTimeout(() => setNewIds(prev => { const n=new Set(prev); n.delete(punch.id); return n }), 3000)
      refreshStats()
    })
    es.onerror = () => setOnline(false)
    return es
  }, [refreshStats])

  useEffect(() => {
    let es, iv
    fetchAll().then(() => {
      es = connectSSE(0)
      iv = setInterval(refreshStats, 10000)
    })
    return () => { es?.close(); clearInterval(iv) }
  }, [])

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>Tableau de bord</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px', textTransform:'capitalize' }}>{dateStr}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', background:online?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)', border:'1px solid '+(online?'rgba(22,163,74,0.2)':'rgba(220,38,38,0.2)') }}>
            {online ? <Wifi size={13} color={t.green}/> : <WifiOff size={13} color={t.red}/>}
            <span style={{ fontSize:'12px', fontWeight:600, color:online?t.green:t.red }}>{online?'En ligne':'Hors ligne'}</span>
          </div>
          <button onClick={fetchAll} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:t.textMuted, fontSize:'12px', fontWeight:500, cursor:'pointer' }}>
            <RefreshCw size={13}/> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px' }}>
        {loading ? [1,2,3,4].map(i=><div key={i} style={{ ...card(), height:'110px', opacity:0.4 }}/>)
          : <>
            <StatCard label="Total Employés"  value={stats?.total_employees??'—'} color="blue"  icon={Users}     sub="enregistrés"/>
            <StatCard label="Présents"         value={stats?.present??'—'}         color="green" icon={UserCheck} sub="aujourd'hui"/>
            <StatCard label="En retard"        value={stats?.late??'—'}            color="amber" icon={Clock}     sub="aujourd'hui"/>
            <StatCard label="Absents"          value={stats?.absent??'—'}          color="red"   icon={UserX}     sub="aujourd'hui"/>
          </>
        }
      </div>

      {/* Live feed */}
      <div style={card({overflow:'hidden'})}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid '+t.border, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:600, color:t.text, margin:0 }}>Pointages en direct</h2>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'2px 8px', borderRadius:'20px', background:'rgba(22,163,74,0.1)', color:t.green, fontSize:'11px', fontWeight:600 }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:t.green }}/>
              LIVE
            </span>
          </div>
          {lastSync && <span style={{ fontSize:'11px', color:t.textFaint }}>Sync {lastSync.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
        </div>
        {feed.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint, fontSize:'14px' }}>Aucun pointage aujourd'hui</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {['Employé','Heure','Date'].map(h=>(
                    <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feed.map(row=>{
                  const isNew = newIds.has(row.id)
                  return (
                    <tr key={row.id} style={{ borderBottom:'1px solid '+t.border, background:isNew?(dark?'rgba(22,163,74,0.08)':'rgba(22,163,74,0.04)'):'transparent', transition:'background 0.5s' }}>
                      <td style={{ padding:'12px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:colorFor(row.employee_name||''), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'12px', flexShrink:0 }}>
                            {initials(row.employee_name||'')}
                          </div>
                          <span style={{ fontSize:'13px', fontWeight:500, color:t.text }}>{row.employee_name||'Inconnu'}</span>
                          {isNew && <span style={{ padding:'1px 7px', borderRadius:'10px', background:'rgba(22,163,74,0.12)', color:t.green, fontSize:'10px', fontWeight:700 }}>NOUVEAU</span>}
                        </div>
                      </td>
                      <td style={{ padding:'12px 20px', fontSize:'13px', fontWeight:600, color:t.primary, fontVariantNumeric:'tabular-nums' }}>{fmtTime(row.punched_at)}</td>
                      <td style={{ padding:'12px 20px', fontSize:'12px', color:t.textMuted }}>{fmtDate(row.punched_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

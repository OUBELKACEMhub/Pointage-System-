import { useEffect, useState, useCallback, useRef } from 'react'
import { Users, UserCheck, Clock, UserX, Wifi, WifiOff, RefreshCw, TrendingUp, AlertTriangle, Settings } from 'lucide-react'
import api from '../api/client'
import StatCard from '../components/StatCard'
import WeekChart from '../components/WeekChart'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'

const POLL_INTERVAL = 3000  // polling toutes les 3s — remplace SSE

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
  const { tr, lang } = useLang()
  const { addToast } = useToast()
  const [stats,     setStats]     = useState(null)
  const [weekData,  setWeekData]  = useState(null)
  const [feed,      setFeed]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [online,    setOnline]    = useState(true)
  const [lastSync,  setLastSync]  = useState(null)
  const [newIds,    setNewIds]    = useState(new Set())
  const [page,      setPage]      = useState(1)
  const PAGE_SIZE = 5
  const feedRef = useRef([])

  // Alertes absences
  const [threshold,    setThreshold]    = useState(3)
  const [thresholdEdit,setThresholdEdit]= useState(false)
  const [thresholdVal, setThresholdVal] = useState(3)
  const [alerts,       setAlerts]       = useState([])

  useEffect(() => {
    api.get('/settings').then(r => {
      const v = parseInt(r.data.absence_threshold) || 3
      setThreshold(v); setThresholdVal(v)
    })
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    api.get('/reports/monthly', { params: { month } }).then(r => {
      setAlerts(r.data.data || [])
    })
  }, [])

  const saveThreshold = async () => {
    const v = parseInt(thresholdVal)
    if (!v || v < 1) return
    await api.put('/settings', { absence_threshold: v })
    setThreshold(v)
    setThresholdEdit(false)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f, w] = await Promise.all([
        api.get('/dashboard/today'),
        api.get('/dashboard/live-feed'),
        api.get('/dashboard/week'),
      ])
      setStats(s.data)
      setFeed(f.data)
      setWeekData(w.data)
      feedRef.current = f.data
      setOnline(true)
      setLastSync(new Date())
      setPage(1)
    } catch { setOnline(false) } finally { setLoading(false) }
  }, [])

  const pollUpdates = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([api.get('/dashboard/today'), api.get('/dashboard/live-feed')])
      setStats(s.data)
      setOnline(true)
      setLastSync(new Date())
      // détecter les nouveaux pointages
      const prevIds = new Set(feedRef.current.map(r => r.id))
      const newEntries = f.data.filter(r => !prevIds.has(r.id))
      if (newEntries.length > 0) {
        setFeed(f.data)
        feedRef.current = f.data
        setPage(1)
        const ids = new Set(newEntries.map(r => r.id))
        setNewIds(prev => new Set([...prev, ...ids]))
        setTimeout(() => setNewIds(prev => {
          const n = new Set(prev); ids.forEach(id => n.delete(id)); return n
        }), 3000)
        // Notification toast pour chaque nouveau pointage
        newEntries.forEach(entry => {
          const name = [entry.employee?.first_name, entry.employee?.last_name].filter(Boolean).join(' ') || 'Employé inconnu'
          const time = entry.punched_at ? String(entry.punched_at).slice(11,16) : ''
          addToast({ title: `${name} vient de pointer`, body: time ? `À ${time}` : null }, 'punch')
        })
      }
    } catch { setOnline(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const iv = setInterval(pollUpdates, POLL_INTERVAL)
    return () => clearInterval(iv)
  }, [])

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const now = new Date()
  const dateStr = now.toLocaleDateString(lang==='ar'?'ar-MA':'fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', flexDirection: lang==='ar'?'row-reverse':'row' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>{tr.dashboardTitle}</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px', textTransform:'capitalize' }}>{dateStr}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', background:online?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)', border:'1px solid '+(online?'rgba(22,163,74,0.2)':'rgba(220,38,38,0.2)') }}>
            {online ? <Wifi size={13} color={t.green}/> : <WifiOff size={13} color={t.red}/>}
            <span style={{ fontSize:'12px', fontWeight:600, color:online?t.green:t.red }}>{online?tr.online:tr.offline}</span>
          </div>
          <button onClick={fetchAll} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:t.textMuted, fontSize:'12px', fontWeight:500, cursor:'pointer' }}>
            <RefreshCw size={13}/> {tr.refresh}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'16px' }}>
        {loading ? [1,2,3,4].map(i=><div key={i} style={{ ...card(), height:'110px', opacity:0.4 }}/>)
          : <>
            <StatCard label={tr.totalEmployees} value={stats?.total??'—'}           color="blue"  icon={Users}     sub={tr.registered}/>
            <StatCard label={tr.present}       value={stats?.present??'—'}         color="green" icon={UserCheck} sub={tr.today}/>
            <StatCard label={tr.late}          value={stats?.late??'—'}            color="amber" icon={Clock}     sub={tr.today}/>
            <StatCard label={tr.absent}        value={stats?.absent??'—'}          color="red"   icon={UserX}     sub={tr.today}/>
          </>
        }
      </div>

      {/* Week chart + metrics */}
      {weekData && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:'16px', alignItems:'stretch' }}>
          {/* Bar chart */}
          <div style={card({ padding:'20px' })}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <h2 style={{ fontSize:'14px', fontWeight:700, color:t.text, margin:0 }}>Presences — 7 derniers jours</h2>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', fontSize:'11px', color:t.textFaint }}>
                <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:2, background:'#6366f1', display:'inline-block' }}/> Presents</span>
                <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:2, background:'#f59e0b80', display:'inline-block' }}/> Retard</span>
                <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:2, background:'#ef444430', display:'inline-block' }}/> Absents</span>
              </div>
            </div>
            <div style={{ height:'140px' }}>
              <WeekChart days={weekData.days} />
            </div>
          </div>

          {/* Side metrics */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {/* Punctuality */}
            <div style={card({ padding:'18px', flex:1 })}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                <TrendingUp size={15} color="#6366f1"/>
                <span style={{ fontSize:'12px', fontWeight:600, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Ponctualite</span>
              </div>
              {weekData.punctuality != null ? (
                <>
                  <div style={{ fontSize:'32px', fontWeight:800, color:'#6366f1', lineHeight:1, marginBottom:'8px' }}>
                    {weekData.punctuality}<span style={{ fontSize:'18px' }}>%</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height:'6px', borderRadius:'3px', background:t.border, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:weekData.punctuality+'%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'3px', transition:'width 0.6s ease' }}/>
                  </div>
                  <div style={{ fontSize:'11px', color:t.textFaint, marginTop:'6px' }}>sur 7 jours</div>
                </>
              ) : (
                <div style={{ fontSize:'13px', color:t.textFaint }}>Pas encore de donnees</div>
              )}
            </div>

            {/* Avg arrival */}
            <div style={card({ padding:'18px', flex:1 })}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <Clock size={15} color="#f59e0b"/>
                <span style={{ fontSize:'12px', fontWeight:600, color:t.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Heure moy. arrivee</span>
              </div>
              <div style={{ fontSize:'28px', fontWeight:800, color:'#f59e0b', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                {weekData.avg_arrival || '—'}
              </div>
              <div style={{ fontSize:'11px', color:t.textFaint, marginTop:'6px' }}>equipe aujourd'hui</div>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTES ABSENCES ──────────────────────────────────────── */}
      {(() => {
        const flagged = alerts.filter(e => (e.absent || 0) >= threshold)
        return (
          <div style={card({ padding:'20px' })}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: flagged.length ? '16px' : 0, flexWrap:'wrap', gap:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <AlertTriangle size={16} color="#ef4444"/>
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:t.text }}>
                    Alertes absences
                    {flagged.length > 0 && (
                      <span style={{ marginLeft:8, padding:'2px 8px', borderRadius:20, background:'rgba(239,68,68,0.15)', color:'#ef4444', fontSize:'11px', fontWeight:700 }}>
                        {flagged.length}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:'11px', color:t.textFaint }}>Employés ayant dépassé le seuil ce mois</div>
                </div>
              </div>
              {/* Seuil éditable */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Settings size={13} color={t.textFaint}/>
                <span style={{ fontSize:'12px', color:t.textMuted }}>Seuil :</span>
                {thresholdEdit ? (
                  <>
                    <input type="number" min="1" max="31" value={thresholdVal}
                      onChange={e => setThresholdVal(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && saveThreshold()}
                      style={{ width:52, padding:'4px 8px', borderRadius:6, border:'1px solid #6366f1', background:t.surface, color:t.text, fontSize:'13px', fontWeight:700, textAlign:'center' }}
                      autoFocus
                    />
                    <button onClick={saveThreshold} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'#6366f1', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>OK</button>
                    <button onClick={() => setThresholdEdit(false)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid '+t.border, background:'none', color:t.textMuted, fontSize:'12px', cursor:'pointer' }}>✕</button>
                  </>
                ) : (
                  <button onClick={() => setThresholdEdit(true)}
                    style={{ padding:'4px 12px', borderRadius:6, border:'1px solid '+t.border, background:t.surface, color:t.text, fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                    {threshold} absences
                  </button>
                )}
              </div>
            </div>

            {flagged.length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:t.textFaint, fontSize:'13px' }}>
                ✅ Aucun employé ne dépasse le seuil de {threshold} absences ce mois
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {flagged.map(emp => (
                  <div key={emp.employee_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:34, height:34, borderRadius:8, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontWeight:700, fontSize:'13px', flexShrink:0 }}>
                        {(emp.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:600, color:t.text }}>{emp.name}</div>
                        <div style={{ fontSize:'11px', color:t.textFaint }}>{emp.department}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'20px', fontWeight:800, color:'#ef4444' }}>{emp.absent}</div>
                        <div style={{ fontSize:'10px', color:t.textFaint }}>absences</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'14px', fontWeight:600, color:'#f59e0b' }}>{emp.late}</div>
                        <div style={{ fontSize:'10px', color:t.textFaint }}>retards</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Live feed */}
      <div style={card({overflow:'hidden'})}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid '+t.border, display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: lang==='ar'?'row-reverse':'row' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:600, color:t.text, margin:0 }}>{tr.liveFeed}</h2>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'2px 8px', borderRadius:'20px', background:'rgba(22,163,74,0.1)', color:t.green, fontSize:'11px', fontWeight:600 }}>
              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:t.green }}/>
              LIVE
            </span>
            {feed.length > 0 && (
              <span style={{ fontSize:'11px', color:t.textFaint }}>{feed.length} {tr.punches}</span>
            )}
          </div>
          {lastSync && <span style={{ fontSize:'11px', color:t.textFaint }}>{tr.sync} {lastSync.toLocaleTimeString(lang==='ar'?'ar-MA':'fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
        </div>
        {feed.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint, fontSize:'14px' }}>{tr.noAttendance}</div>
        ) : (() => {
          const totalPages = Math.ceil(feed.length / PAGE_SIZE)
          const safePage   = Math.min(page, totalPages)
          const pageRows   = feed.slice((safePage-1)*PAGE_SIZE, safePage*PAGE_SIZE)
          const btnStyle = (disabled) => ({
            display:'flex', alignItems:'center', justifyContent:'center',
            width:'30px', height:'30px', borderRadius:'8px',
            border:'1px solid '+t.border, background:disabled?'transparent':t.surface,
            color:disabled?t.textFaint:t.text, cursor:disabled?'default':'pointer',
            fontSize:'14px', fontWeight:600, opacity:disabled?0.4:1,
            transition:'background 0.15s',
          })
          return (
            <>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid '+t.border }}>
                      {[tr.employee, tr.time, tr.date].map(h=>(
                        <th key={h} style={{ padding:'10px 20px', textAlign:'start', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(row=>{
                      const isNew = newIds.has(row.id)
                      return (
                        <tr key={row.id} style={{ borderBottom:'1px solid '+t.border, background:isNew?(dark?'rgba(22,163,74,0.08)':'rgba(22,163,74,0.04)'):'transparent', transition:'background 0.5s' }}>
                          <td style={{ padding:'12px 20px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:colorFor(row.full_name||''), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'12px', flexShrink:0 }}>
                                {initials(row.full_name||'')}
                              </div>
                              <span style={{ fontSize:'13px', fontWeight:500, color:t.text }}>{row.full_name||'Inconnu'}</span>
                              {isNew && <span style={{ padding:'1px 7px', borderRadius:'10px', background:'rgba(22,163,74,0.12)', color:t.green, fontSize:'10px', fontWeight:700 }}>{tr.newBadge}</span>}
                            </div>
                          </td>
                          <td style={{ padding:'12px 20px', fontSize:'13px', fontWeight:600, color:t.primary, fontVariantNumeric:'tabular-nums', textAlign:'start' }}>{fmtTime(row.punched_at)}</td>
                          <td style={{ padding:'12px 20px', fontSize:'12px', color:t.textMuted, textAlign:'start' }}>{fmtDate(row.punched_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ padding:'12px 20px', borderTop:'1px solid '+t.border, display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection: lang==='ar' ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize:'12px', color:t.textFaint }}>
                    {tr.page} {safePage} / {totalPages} — {(safePage-1)*PAGE_SIZE+1}–{Math.min(safePage*PAGE_SIZE, feed.length)} {tr.of} {feed.length}
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', flexDirection: lang==='ar' ? 'row-reverse' : 'row' }}>
                    <button onClick={()=>setPage(1)} disabled={safePage===1} style={btnStyle(safePage===1)}>{lang==='ar'?'»':'«'}</button>
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} style={btnStyle(safePage===1)}>{lang==='ar'?'›':'‹'}</button>
                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>setPage(p)} style={{
                        ...btnStyle(false),
                        background: p===safePage ? t.primary : 'transparent',
                        color:      p===safePage ? '#fff'     : t.textMuted,
                        border:     p===safePage ? 'none'     : '1px solid '+t.border,
                        fontWeight: p===safePage ? 700        : 500,
                      }}>{p}</button>
                    ))}
                    <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={btnStyle(safePage===totalPages)}>{lang==='ar'?'‹':'›'}</button>
                    <button onClick={()=>setPage(totalPages)} disabled={safePage===totalPages} style={btnStyle(safePage===totalPages)}>{lang==='ar'?'«':'»'}</button>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}

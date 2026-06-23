import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, Clock, CalendarCheck, UserX,
  ChevronLeft, ChevronRight, Camera, Loader,
  Phone, Mail, MapPin, CreditCard, Briefcase, Calendar as CalendarIcon, User, Hash,
} from 'lucide-react'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = n => COLORS[(n||'').charCodeAt(0)%COLORS.length]
const initials = (f='',l='') => ((f[0]??'')+(l[0]??'')).toUpperCase()
const fmtTime = s => {
  if (!s) return '—'
  const str = String(s).replace('T', ' ')
  return str.length <= 8 ? str.slice(0, 5) : str.slice(11, 16)
}
const fmtDate = s => s ? String(s).slice(0, 10) : '—'
const fmtDateLocale = (s, lang) => {
  if (!s) return null
  try {
    return new Date(s).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  } catch { return String(s).slice(0, 10) }
}
const yearsFrom = s => {
  if (!s) return null
  const diff = (new Date() - new Date(s)) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.floor(diff)
}

const STATUS_COLOR = { present:'#16a34a', late:'#f59e0b', absent:'#ef4444' }

const CONTRACT_COLOR = { cdi:'#6366f1', cdd:'#f59e0b', stage:'#14b8a6', freelance:'#ec4899' }

function Avatar({ emp, size=80, radius=16, onClick, uploading }) {
  const [hovered, setHovered] = useState(false)
  const color = colorFor(emp.first_name)
  const show = (hovered || uploading) && onClick
  return (
    <div style={{ position:'relative', width:size, height:size, borderRadius:radius, flexShrink:0, cursor:onClick?'pointer':'default' }}
      onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {emp.photo_url
        ? <img src={emp.photo_url} alt={emp.first_name} style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', display:'block' }}/>
        : <div style={{ width:size, height:size, borderRadius:radius, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:Math.round(size*0.33) }}>
            {initials(emp.first_name, emp.last_name)}
          </div>
      }
      {show && (
        <div style={{ position:'absolute', inset:0, borderRadius:radius, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {uploading
            ? <Loader size={Math.round(size*0.28)} color="#fff" style={{ animation:'spin 1s linear infinite' }}/>
            : <Camera size={Math.round(size*0.28)} color="#fff"/>}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, color = null }) {
  const { t } = useTheme()
  if (!value) return null
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 0', borderBottom:'1px solid '+t.border }}>
      <div style={{ width:30, height:30, borderRadius:8, background:(color||'#6366f1')+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
        <Icon size={14} color={color||'#6366f1'}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'10px', fontWeight:600, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>{label}</div>
        <div style={{ fontSize:'13px', fontWeight:500, color:t.text, wordBreak:'break-word' }}>{value}</div>
      </div>
    </div>
  )
}

function Calendar({ employeeId, t, tr }) {
  const now   = new Date()
  const [year,  setYear]    = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const m = `${year}-${String(month+1).padStart(2,'00')}`
    try {
      const r = await api.get(`/employees/${employeeId}/calendar`, { params: { month: m } })
      setRecords(r.data.records || {})
    } catch {} finally { setLoading(false) }
  }, [employeeId, year, month])

  useEffect(() => { load() }, [load])

  const prevMonth = () => { if (month===0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }
  const nextMonth = () => {
    const n = new Date(); if (year > n.getFullYear() || (year===n.getFullYear() && month>=n.getMonth())) return
    if (month===11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1)
  }
  const isNextDisabled = () => { const n=new Date(); return year>n.getFullYear()||(year===n.getFullYear()&&month>=n.getMonth()) }

  const firstDay = new Date(year, month, 1).getDay()
  const firstOffset = firstDay===0 ? 6 : firstDay-1
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i=0; i<firstOffset; i++) cells.push(null)
  for (let d=1; d<=daysInMonth; d++) cells.push(d)
  const todayKey = `${year}-${String(month+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const dayLabels  = tr.dayLabels  || ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const monthNames = tr.monthNames || ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  const statusLabel = { present: tr.statusPresent, late: tr.statusLate, absent: tr.statusAbsent }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <button onClick={prevMonth} style={{ background:'none', border:'1px solid '+t.border, borderRadius:'8px', padding:'6px 10px', cursor:'pointer', color:t.text, display:'flex', alignItems:'center' }}><ChevronLeft size={16}/></button>
        <span style={{ fontSize:'15px', fontWeight:700, color:t.text }}>{monthNames[month]} {year}</span>
        <button onClick={nextMonth} disabled={isNextDisabled()} style={{ background:'none', border:'1px solid '+t.border, borderRadius:'8px', padding:'6px 10px', cursor:isNextDisabled()?'not-allowed':'pointer', color:isNextDisabled()?t.textFaint:t.text, opacity:isNextDisabled()?0.4:1, display:'flex', alignItems:'center' }}><ChevronRight size={16}/></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'4px' }}>
        {dayLabels.map(d=>(
          <div key={d} style={{ textAlign:'center', fontSize:'10px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign:'center', padding:'32px', color:t.textFaint }}>{tr.loading}</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={'e'+i}/>
            const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const rec = records[dateKey], status = rec?.status, onLeave = rec?.on_leave
            const isToday = dateKey === todayKey
            const isFuture = new Date(dateKey) > new Date()
            const isWeekend = ((i % 7) + firstOffset) % 7 >= 5
            let bg='transparent', textColor=t.textFaint, border='1px solid transparent', dot=null
            if (isToday) { border='2px solid #6366f1'; textColor='#6366f1' }
            if (isFuture) { textColor=t.textFaint }
            else if (onLeave)            { bg='rgba(59,130,246,0.12)'; textColor='#60a5fa'; border='1px solid rgba(59,130,246,0.3)'; dot='🏖' }
            else if (status==='present') { bg='#16a34a18'; textColor='#16a34a'; border='1px solid #16a34a30' }
            else if (status==='late')    { bg='#f59e0b18'; textColor='#f59e0b'; border='1px solid #f59e0b30' }
            else if (status==='absent' && !isWeekend) { bg='#ef444418'; textColor='#ef4444'; border='1px solid #ef444430' }
            const titleTxt = onLeave ? (tr.onLeave ?? 'En congé') : status ? (statusLabel[status]||status)+' — '+(rec.check_in?fmtTime(rec.check_in):'') : undefined
            return (
              <div key={dateKey} title={titleTxt}
                style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', background:bg, border, flexDirection:'column', gap:'1px' }}>
                {dot && <span style={{ fontSize:'9px', lineHeight:1 }}>{dot}</span>}
                <span style={{ fontSize:'12px', fontWeight:isToday?800:(status||onLeave)?600:400, color:textColor }}>{day}</span>
                {!onLeave && status && rec.check_in && <span style={{ fontSize:'8px', color:textColor, opacity:0.8, fontVariantNumeric:'tabular-nums' }}>{fmtTime(rec.check_in)}</span>}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display:'flex', gap:'16px', marginTop:'14px', flexWrap:'wrap' }}>
        {[['#16a34a',tr.statusPresent],['#f59e0b',tr.statusLate],['#ef4444',tr.statusAbsent],['#3b82f6',tr.onLeave??'En congé']].map(([c,l])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:t.textMuted }}>
            <div style={{ width:'10px', height:'10px', borderRadius:'3px', background:c+'28', border:'1px solid '+c+'50' }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EmployeeProfile() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { t }    = useTheme()
  const { tr, lang } = useLang()
  const fileRef  = useRef()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView]   = useState('history')
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    api.get(`/employees/${id}/profile`)
      .then(r => setData(r.data))
      .catch(() => navigate('/employees', { replace: true }))
      .finally(() => setLoading(false))
  }, [id])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const r = await api.post(`/employees/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setData(prev => ({ ...prev, employee: { ...prev.employee, photo_url: r.data.photo_url } }))
    } catch {} finally { setPhotoUploading(false); e.target.value = '' }
  }

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px', color:t.textFaint }}>{tr.loading}</div>
  )
  if (!data) return null

  const { employee: emp, stats, avg_arrival, history, overtime_minutes, mission_overtime_minutes } = data
  const fmtOT = m => m > 0 ? Math.floor(m/60)+'h'+String(m%60).padStart(2,'0') : '—'
  const statusLabel = { present: tr.statusPresent, late: tr.statusLate, absent: tr.statusAbsent }

  const contractLabel = { cdi: tr.contractCdi, cdd: tr.contractCdd, stage: tr.contractStage, freelance: tr.contractFreelance }
  const contractColor = emp.contract_type ? CONTRACT_COLOR[emp.contract_type] : null
  const age = emp.age ?? yearsFrom(emp.birth_date)
  const yearsOfService = yearsFrom(emp.hire_date)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <button onClick={()=>navigate('/employees')} style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', color:t.textMuted, fontSize:'13px', fontWeight:500, padding:0, alignSelf:'flex-start' }}>
        <ArrowLeft size={15}/> {tr.backToEmployees}
      </button>

      {/* ── HERO CARD ─────────────────────────────────────────────── */}
      <div style={card({ padding:'28px' })}>
        <div style={{ display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'flex-start' }}>

          {/* Left: photo + upload hint */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <Avatar emp={emp} size={96} radius={20} uploading={photoUploading} onClick={()=>fileRef.current?.click()}/>
            <span style={{ fontSize:'10px', color:t.textFaint, textAlign:'center', maxWidth:'96px', lineHeight:'1.3' }}>{tr.clickToChangePhoto}</span>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload}/>
          </div>

          {/* Right: name + badges + quick info */}
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:'24px', fontWeight:800, color:t.text, margin:'0 0 8px' }}>{emp.first_name} {emp.last_name}</h1>

            {/* Badge row */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
              {emp.position && (
                <span style={{ padding:'3px 10px', borderRadius:'8px', background:t.primaryBg, color:t.primary, fontSize:'12px', fontWeight:600 }}>
                  {emp.position}
                </span>
              )}
              {emp.department && (
                <span style={{ padding:'3px 10px', borderRadius:'8px', background:t.border, color:t.textMuted, fontSize:'12px', fontWeight:600 }}>
                  {emp.department}
                </span>
              )}
              {emp.contract_type && (
                <span style={{ padding:'3px 10px', borderRadius:'8px', background:(contractColor||'#6366f1')+'18', color:contractColor||'#6366f1', fontSize:'12px', fontWeight:700 }}>
                  {contractLabel[emp.contract_type] || emp.contract_type.toUpperCase()}
                </span>
              )}
              <span style={{ padding:'3px 10px', borderRadius:'8px', background:t.primaryBg, color:t.primary, fontSize:'11px', fontWeight:600, fontFamily:'monospace' }}>
                UID {emp.zkteco_uid}
              </span>
              <span style={{ padding:'3px 10px', borderRadius:'8px', background:emp.is_active?'#16a34a18':'#ef444418', color:emp.is_active?'#16a34a':'#ef4444', fontSize:'12px', fontWeight:600 }}>
                {emp.is_active ? tr.statusActive : tr.statusInactive}
              </span>
            </div>

            {/* Quick info pills */}
            <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
              {age != null && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:t.textMuted }}>
                  <User size={13} color={t.textFaint}/>
                  <span><strong style={{ color:t.text }}>{age}</strong> {tr.years}</span>
                </div>
              )}
              {emp.phone && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:t.textMuted }}>
                  <Phone size={13} color={t.textFaint}/>
                  <span>{emp.phone}</span>
                </div>
              )}
              {emp.email && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:t.textMuted }}>
                  <Mail size={13} color={t.textFaint}/>
                  <span>{emp.email}</span>
                </div>
              )}
              {yearsOfService != null && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:t.textMuted }}>
                  <Briefcase size={13} color={t.textFaint}/>
                  <span><strong style={{ color:t.text }}>{yearsOfService}</strong> {tr.years} {tr.yearsOfService}</span>
                </div>
              )}
              {emp.cin && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:t.textMuted }}>
                  <CreditCard size={13} color={t.textFaint}/>
                  <span>{emp.cin}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'12px' }}>
            {[
              { icon:CalendarCheck, label:tr.statusPresent, value:stats.present,    color:'#16a34a' },
              { icon:Clock,         label:tr.statusLate,    value:stats.late,       color:'#f59e0b' },
              { icon:UserX,         label:tr.statusAbsent,  value:stats.absent,     color:'#ef4444' },
              { icon:TrendingUp,    label:tr.punctuality,   value:stats.punctuality!=null?stats.punctuality+'%':'—', color:'#6366f1' },
              { icon:Clock,         label:tr.avgArrival,    value:avg_arrival||'—', color:'#8b5cf6' },
              { icon:TrendingUp,    label:tr.overtime,      value:fmtOT(overtime_minutes||0), color:'#f59e0b', sub: mission_overtime_minutes > 0 ? `dont ${fmtOT(mission_overtime_minutes)} mission` : null },
            ].map(({ icon:Icon, label, value, color:c, sub })=>(
              <div key={label} style={card({ padding:'14px' })}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'8px' }}>
                  <Icon size={13} color={c}/>
                  <span style={{ fontSize:'10px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                </div>
                <div style={{ fontSize:'24px', fontWeight:800, color:c, fontVariantNumeric:'tabular-nums' }}>{value}</div>
                <div style={{ fontSize:'10px', color:t.textFaint, marginTop:'3px' }}>{tr.thisMonth}</div>
                {sub && <div style={{ fontSize:'10px', color:c, marginTop:'2px', opacity:0.7 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Punctuality bar */}
          {stats.punctuality != null && (
            <div style={card({ padding:'14px 18px' })}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <span style={{ fontSize:'13px', fontWeight:600, color:t.text }}>{tr.punctualityRate}</span>
                <span style={{ fontSize:'15px', fontWeight:800, color:'#6366f1' }}>{stats.punctuality}%</span>
              </div>
              <div style={{ height:'7px', borderRadius:'4px', background:t.border, overflow:'hidden' }}>
                <div style={{ height:'100%', width:stats.punctuality+'%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'4px', transition:'width 0.8s ease' }}/>
              </div>
            </div>
          )}
        </div>

      {/* ── INFO PANEL (2 colonnes compactes) ─────────────────────── */}
      <div style={card({ padding:'16px 20px' })}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px' }}>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>{tr.personalInfo}</div>
            {age != null && <InfoRow icon={User} label={tr.age} value={`${age} ${tr.years}`} color="#6366f1"/>}
            {emp.birth_date && <InfoRow icon={CalendarIcon} label={tr.birthDate} value={fmtDateLocale(emp.birth_date, lang)} color="#8b5cf6"/>}
            {emp.cin && <InfoRow icon={CreditCard} label={tr.cin} value={emp.cin} color="#ec4899"/>}
            {emp.phone && <InfoRow icon={Phone} label={tr.phone} value={emp.phone} color="#14b8a6"/>}
            {emp.email && <InfoRow icon={Mail} label={tr.email} value={emp.email} color="#6366f1"/>}
            {emp.address && <InfoRow icon={MapPin} label={tr.address} value={emp.address} color="#f59e0b"/>}
          </div>
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>{tr.workInfo}</div>
            {emp.hire_date && <InfoRow icon={Briefcase} label={tr.hireDate} value={fmtDateLocale(emp.hire_date, lang)} color="#6366f1"/>}
            {emp.contract_type && <InfoRow icon={Hash} label={tr.contractType} value={contractLabel[emp.contract_type] || emp.contract_type} color={contractColor}/>}
            <InfoRow icon={CalendarIcon} label={tr.memberSince} value={fmtDateLocale(emp.created_at, lang)} color="#8b5cf6"/>
          </div>
        </div>
      </div>

      {/* ── HISTORY / CALENDAR TABS ──────────────────────────────── */}
      <div style={{ display:'flex', gap:'8px' }}>
        {[['history', tr.history30],['calendar', tr.calendar]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{ padding:'8px 18px', borderRadius:'8px', border:'1px solid '+t.border, fontSize:'13px', fontWeight:600, cursor:'pointer',
              background: view===v ? '#6366f1' : 'none',
              color:      view===v ? '#fff'    : t.textMuted }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'history' && (
        <div style={card({ overflow:'hidden' })}>
          {history.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>{tr.noHistory}</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid '+t.border }}>
                    {[tr.colDate, tr.colEntry, tr.colExit, tr.colDuration, tr.colStatus].map(h=>(
                      <th key={h} style={{ padding:'11px 18px', textAlign:'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(row=>(
                    <tr key={row.work_date} style={{ borderBottom:'1px solid '+t.border, transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 18px', fontSize:'13px', fontVariantNumeric:'tabular-nums', color:t.text, fontWeight:500 }}>{fmtDate(row.work_date)}</td>
                      <td style={{ padding:'12px 18px', fontSize:'13px', fontWeight:600, color:'#16a34a', fontVariantNumeric:'tabular-nums' }}>{fmtTime(row.check_in)}</td>
                      <td style={{ padding:'12px 18px', fontSize:'13px', fontWeight:600, color:'#ef4444', fontVariantNumeric:'tabular-nums' }}>{fmtTime(row.check_out)}</td>
                      <td style={{ padding:'12px 18px', fontSize:'13px', color:t.textMuted, fontVariantNumeric:'tabular-nums' }}>{row.worked_hours || '—'}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px', alignItems:'flex-start' }}>
                          {row.on_leave ? (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }}>
                              🏖 {tr.onLeave ?? 'En congé'}
                            </span>
                          ) : (
                            <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600,
                              background:(STATUS_COLOR[row.status]||'#64748b')+'18',
                              color:STATUS_COLOR[row.status]||'#64748b' }}>
                              {statusLabel[row.status]||row.status}
                            </span>
                          )}
                          {row.justification && !row.on_leave && (
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:600, color:'#6366f1', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'20px', padding:'2px 8px', maxWidth:'180px' }}
                              title={row.justification.reason}>
                              ✓ {row.justification.reason.length > 28 ? row.justification.reason.slice(0,28)+'…' : row.justification.reason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <div style={card({ padding:'24px' })}>
          <Calendar employeeId={id} t={t} tr={tr} />
        </div>
      )}
    </div>
  )
}

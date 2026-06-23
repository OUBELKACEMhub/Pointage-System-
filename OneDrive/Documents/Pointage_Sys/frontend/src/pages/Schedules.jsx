import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Clock } from 'lucide-react'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

const EMPTY = { name:'Horaire standard', start_time:'08:30', end_time:'17:30', tolerance_minutes:15, is_active:true }

export default function Schedules() {
  const { t } = useTheme()
  const { tr } = useLang()
  const [schedules, setSchedules] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [error,     setError]     = useState('')

  const load = () => api.get('/schedules').then(r=>setSchedules(r.data)).catch(()=>{})
  useEffect(()=>{ load() },[])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = s => { setForm({...s,start_time:s.start_time?.slice(0,5),end_time:s.end_time?.slice(0,5)}); setEditing(s.id); setError(''); setShowModal(true) }
  const save = async () => {
    try {
      editing ? await api.put(`/schedules/${editing}`,form) : await api.post('/schedules',form)
      setShowModal(false); load()
    } catch(e){ setError(e.response?.data?.message??'Erreur') }
  }
  const remove = async id => {
    if(!confirm(tr.confirmSchedule)) return
    await api.delete(`/schedules/${id}`).catch(()=>{})
    load()
  }

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const inp  = (extra={}) => ({ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:'8px', border:'1.5px solid '+t.border, background:t.bg, color:t.text, fontSize:'13px', outline:'none', ...extra })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>{tr.schedulesTitle}</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>{tr.schedulesSub}</p>
        </div>
        <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 18px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
          <Plus size={15}/> {tr.addSchedule}
        </button>
      </div>

      {schedules.length===0 ? (
        <div style={card({ padding:'48px', textAlign:'center', color:t.textFaint })}>
          <Clock size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
          {tr.noSchedules}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {schedules.map(s=>(
            <div key={s.id} style={card({ padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', transition:'box-shadow 0.2s' })}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:t.primaryBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Clock size={20} color={t.primary}/>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <span style={{ fontSize:'15px', fontWeight:600, color:t.text }}>{s.name}</span>
                    <span style={{ padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:s.is_active?t.badge.present.bg:'rgba(100,116,139,0.1)', color:s.is_active?t.green:'#64748b' }}>
                      {s.is_active ? tr.statusActive : tr.statusInactive}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:'16px', fontSize:'13px', color:t.textMuted }}>
                    <span>{tr.scheduleEntry}: <strong style={{ color:t.text }}>{s.start_time?.slice(0,5)}</strong></span>
                    <span>{tr.scheduleExit}: <strong style={{ color:t.text }}>{s.end_time?.slice(0,5)}</strong></span>
                    <span>{tr.scheduleTol}: <strong style={{ color:t.text }}>{s.tolerance_minutes} min</strong></span>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                <button onClick={()=>openEdit(s)} style={{ padding:'7px 14px', borderRadius:'8px', background:t.primaryBg, border:'1px solid '+t.primaryBorder, color:t.primary, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                  <Pencil size={13}/> {tr.edit}
                </button>
                <button onClick={()=>remove(s.id)} style={{ padding:'7px 14px', borderRadius:'8px', background:t.badge.absent.bg, border:'1px solid rgba(220,38,38,0.2)', color:t.red, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                  <Trash2 size={13}/> {tr.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' }}>
          <div style={{ background:t.surface, border:'1px solid '+t.border, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'420px', boxShadow:'0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h3 style={{ fontSize:'17px', fontWeight:700, color:t.text, margin:0 }}>{editing ? tr.editSchedule : tr.schedulesTitle}</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:t.textMuted, display:'flex' }}><X size={20}/></button>
            </div>
            {error && <div style={{ padding:'10px 14px', borderRadius:'8px', background:t.badge.absent.bg, color:t.red, fontSize:'13px', marginBottom:'16px' }}>{error}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'24px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.scheduleName}</label>
                <input value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inp()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[['start_time', tr.startTime],['end_time', tr.endTime]].map(([k,l])=>(
                  <div key={k}>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{l}</label>
                    <input type="time" value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()}
                      onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.gracePeriod}</label>
                <input type="number" min={0} max={60} value={form.tolerance_minutes||0} onChange={e=>setForm(p=>({...p,tolerance_minutes:+e.target.value}))} style={inp()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <input type="checkbox" id="is_active" checked={!!form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} style={{ width:'16px', height:'16px', cursor:'pointer', accentColor:'#6366f1' }}/>
                <label htmlFor="is_active" style={{ fontSize:'13px', color:t.text, cursor:'pointer' }}>{tr.scheduleActive}</label>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 18px', borderRadius:'8px', background:'none', border:'1px solid '+t.border, color:t.textMuted, fontSize:'13px', cursor:'pointer' }}>{tr.cancel}</button>
              <button onClick={save} style={{ padding:'9px 18px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>{editing ? tr.save : tr.addSchedule}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

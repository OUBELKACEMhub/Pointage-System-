import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Search, Users, Camera, Loader, TrendingUp } from 'lucide-react'

const fmtOT = m => {
  if (!m) return null
  const h = Math.floor(m / 60), mn = m % 60
  return h > 0 ? `${h}h${String(mn).padStart(2,'0')}` : `${mn}min`
}
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'

const EMPTY = { first_name:'', last_name:'', department:'', position:'', zkteco_uid:'' }
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = n => COLORS[(n||'').charCodeAt(0)%COLORS.length]
const initials = (f,l) => ((f?.[0]??'')+(l?.[0]??'')).toUpperCase()

function MiniAvatar({ emp, size=34, radius=8 }) {
  const color = colorFor(emp.first_name)
  return emp.photo_url ? (
    <img src={emp.photo_url} alt={emp.first_name}
      style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', display:'block', flexShrink:0 }}/>
  ) : (
    <div style={{ width:size, height:size, borderRadius:radius, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:Math.round(size*0.38), flexShrink:0 }}>
      {initials(emp.first_name, emp.last_name)}
    </div>
  )
}

function ModalAvatar({ emp, onUpload, uploading }) {
  const [hovered, setHovered] = useState(false)
  const color = colorFor(emp.first_name)
  return (
    <div style={{ position:'relative', width:72, height:72, cursor:'pointer', margin:'0 auto 4px' }}
      onClick={onUpload}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}>
      {emp.photo_url ? (
        <img src={emp.photo_url} alt={emp.first_name}
          style={{ width:72, height:72, borderRadius:16, objectFit:'cover', display:'block' }}/>
      ) : (
        <div style={{ width:72, height:72, borderRadius:16, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:24 }}>
          {initials(emp.first_name, emp.last_name)}
        </div>
      )}
      {/* Overlay hover */}
      {hovered && !uploading && (
        <div style={{ position:'absolute', inset:0, borderRadius:16, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Camera size={22} color="#fff"/>
        </div>
      )}
      {/* Badge caméra permanent (coin bas-droit) */}
      <div style={{ position:'absolute', bottom:-4, right:-4, width:24, height:24, borderRadius:'50%', background:'#6366f1', border:'2px solid #1f2937', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {uploading
          ? <Loader size={12} color="#fff" style={{ animation:'spin 1s linear infinite' }}/>
          : <Camera size={12} color="#fff"/>}
      </div>
    </div>
  )
}

export default function Employees() {
  const { t } = useTheme()
  const { tr } = useLang()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [employees,    setEmployees]    = useState([])
  const [threshold,    setThreshold]    = useState(3)
  const [search,       setSearch]       = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [editing,      setEditing]      = useState(null)
  const [error,        setError]        = useState('')
  const [loading,        setLoading]        = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [pendingPhoto,   setPendingPhoto]   = useState(null)  // photo sélectionnée avant création
  const [pendingPreview, setPendingPreview] = useState(null)  // aperçu local

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/employees')
      setEmployees(Array.isArray(r.data) ? r.data : (r.data.data??[]))
    } catch {} finally { setLoading(false) }
  }
  useEffect(()=>{
    load()
    api.get('/settings').then(r => setThreshold(parseInt(r.data.absence_threshold)||3))
  },[])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setPendingPhoto(null); setPendingPreview(null); setShowModal(true) }
  const openEdit = e => { setForm({...e}); setEditing(e.id); setError(''); setPendingPhoto(null); setPendingPreview(null); setShowModal(true) }

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/employees/${editing}`, form)
      } else {
        const r = await api.post('/employees', form)
        // upload photo si sélectionnée lors de la création
        if (pendingPhoto && r.data?.id) {
          const fd = new FormData()
          fd.append('photo', pendingPhoto)
          await api.post(`/employees/${r.data.id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
      }
      setShowModal(false); setPendingPhoto(null); setPendingPreview(null); load()
    } catch(e){ setError(e.response?.data?.message??'Erreur') }
  }

  const remove = async id => {
    if(!confirm(tr.confirmDelete)) return
    await api.delete(`/employees/${id}`).catch(()=>{})
    load()
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!editing) {
      // mode ajout : stocker localement pour upload après création
      setPendingPhoto(file)
      setPendingPreview(URL.createObjectURL(file))
      e.target.value = ''
      return
    }
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const r = await api.post(`/employees/${editing}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm(prev => ({ ...prev, photo_url: r.data.photo_url }))
      setEmployees(prev => prev.map(emp => emp.id === editing ? { ...emp, photo_url: r.data.photo_url } : emp))
    } catch {} finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  const filtered = employees.filter(e =>
    (e.first_name+' '+e.last_name+' '+(e.department||'')).toLowerCase().includes(search.toLowerCase())
  )

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const inp = (extra={}) => ({ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:'8px', border:'1.5px solid '+t.border, background:t.bg, color:t.text, fontSize:'13px', outline:'none', ...extra })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>{tr.employeesTitle}</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>
            {employees.length} {tr.employees} {tr.registered}
          </p>
        </div>
        <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 18px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
          <Plus size={15}/> {tr.addEmployee}
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:t.textFaint, pointerEvents:'none' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr.searchEmployee}
          style={{ ...inp(), paddingLeft:'36px', maxWidth:'320px' }}
          onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}
        />
      </div>

      {/* Table */}
      <div style={card({overflow:'hidden'})}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>{tr.loading}</div>
        ) : filtered.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>
            <Users size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
            {tr.noEmployees}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {[tr.employee, tr.department, tr.position, tr.overtime+' ('+tr.thisMonthShort+')', tr.actions].map(h=>(
                    <th key={h} style={{ padding:'11px 20px', textAlign:h===tr.actions?'right':'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp=>(
                  <tr key={emp.id} style={{ borderBottom:'1px solid '+t.border, transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'13px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <MiniAvatar emp={emp}/>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span onClick={()=>navigate(`/employees/${emp.id}`)}
                            style={{ fontSize:'13px', fontWeight:500, color:t.primary, cursor:'pointer', textDecoration:'underline', textDecorationColor:t.primary+'50' }}>
                            {emp.first_name} {emp.last_name}
                          </span>
                          {(emp.month_absent||0) >= threshold && (
                            <span title={`${emp.month_absent} absences ce mois — seuil : ${threshold}`}
                              style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:20, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', fontSize:'10px', fontWeight:700 }}>
                              ⚠ {emp.month_absent} abs.
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 20px', fontSize:'13px', color:t.textMuted }}>{emp.department||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:'13px', color:t.textMuted }}>{emp.position||'—'}</td>

                    {/* Overtime + mini attendance stats */}
                    <td style={{ padding:'13px 20px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                        {/* Overtime badge */}
                        {emp.month_overtime > 0 ? (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px', background:'#f59e0b18', border:'1px solid #f59e0b30', width:'fit-content' }}>
                            <TrendingUp size={11} color="#f59e0b"/>
                            <span style={{ fontSize:'12px', fontWeight:700, color:'#f59e0b', fontVariantNumeric:'tabular-nums' }}>
                              {fmtOT(emp.month_overtime)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize:'11px', color:t.textFaint }}>—</span>
                        )}
                        {/* Mini present/late/absent pills */}
                        <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                          {emp.month_present > 0 && (
                            <span style={{ padding:'1px 6px', borderRadius:'4px', background:'#16a34a18', color:'#16a34a', fontSize:'10px', fontWeight:600 }}>✓ {emp.month_present}</span>
                          )}
                          {emp.month_late > 0 && (
                            <span style={{ padding:'1px 6px', borderRadius:'4px', background:'#f59e0b18', color:'#f59e0b', fontSize:'10px', fontWeight:600 }}>⏱ {emp.month_late}</span>
                          )}
                          {emp.month_absent > 0 && (
                            <span style={{ padding:'1px 6px', borderRadius:'4px', background:'#ef444418', color:'#ef4444', fontSize:'10px', fontWeight:600 }}>✗ {emp.month_absent}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 20px', textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
                        <button onClick={()=>openEdit(emp)} style={{ padding:'5px 10px', borderRadius:'7px', background:t.primaryBg, border:'1px solid '+t.primaryBorder, color:t.primary, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                          <Pencil size={12}/> {tr.edit}
                        </button>
                        <button onClick={()=>remove(emp.id)} style={{ padding:'5px 10px', borderRadius:'7px', background:t.badge.absent.bg, border:'1px solid rgba(220,38,38,0.2)', color:t.red, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                          <Trash2 size={12}/> {tr.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' }}>
          <div style={{ background:t.surface, border:'1px solid '+t.border, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'17px', fontWeight:700, color:t.text, margin:0 }}>
                {editing ? tr.edit : tr.addEmployee}
              </h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:t.textMuted, display:'flex' }}><X size={20}/></button>
            </div>

            {/* Photo upload — ajout et modification */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', marginBottom:'20px' }}>
              <ModalAvatar
                emp={editing ? form : { ...form, photo_url: pendingPreview }}
                onUpload={() => fileRef.current?.click()}
                uploading={photoUploading}
              />
              <span style={{ fontSize:'11px', color:t.textFaint }}>
                {pendingPreview && !editing ? '✓ Photo sélectionnée' : tr.clickToChangePhoto}
              </span>
              <span style={{ fontSize:'10px', color:t.textFaint, opacity:0.7 }}>{tr.photoHint}</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload}/>
            </div>

            {error && <div style={{ padding:'10px 14px', borderRadius:'8px', background:t.badge.absent.bg, color:t.red, fontSize:'13px', marginBottom:'16px', border:'1px solid rgba(220,38,38,0.2)' }}>{error}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              {[['first_name', tr.firstName],['last_name', tr.lastName]].map(([k,l])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              {[['department', tr.department],['position', tr.position]].map(([k,l])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.zkId}</label>
              <input value={form.zkteco_uid||''} onChange={e=>setForm(p=>({...p,zkteco_uid:e.target.value}))} style={inp()}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
            </div>

            {/* Separator */}
            <div style={{ borderTop:'1px solid '+t.border, margin:'4px 0 16px', opacity:0.5 }}/>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.birthDate}</label>
                <input type="date" value={form.birth_date||''} onChange={e=>setForm(p=>({...p,birth_date:e.target.value}))} style={inp()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.cin}</label>
                <input value={form.cin||''} onChange={e=>setForm(p=>({...p,cin:e.target.value}))} style={inp()} placeholder="AB123456"
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.phone}</label>
                <input value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} style={inp()} placeholder="+212 6XX XXX XXX"
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.email}</label>
                <input type="email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={inp()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.hireDate}</label>
                <input type="date" value={form.hire_date||''} onChange={e=>setForm(p=>({...p,hire_date:e.target.value}))} style={inp()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.contractType}</label>
                <select value={form.contract_type||''} onChange={e=>setForm(p=>({...p,contract_type:e.target.value}))} style={inp({ cursor:'pointer' })}>
                  <option value="">—</option>
                  <option value="cdi">{tr.contractCdi}</option>
                  <option value="cdd">{tr.contractCdd}</option>
                  <option value="stage">{tr.contractStage}</option>
                  <option value="freelance">{tr.contractFreelance}</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{tr.address}</label>
              <input value={form.address||''} onChange={e=>setForm(p=>({...p,address:e.target.value}))} style={inp()}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
            </div>

            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 18px', borderRadius:'8px', background:'none', border:'1px solid '+t.border, color:t.textMuted, fontSize:'13px', fontWeight:500, cursor:'pointer' }}>{tr.cancel}</button>
              <button onClick={save} style={{ padding:'9px 18px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                {editing ? tr.save : tr.addEmployee}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

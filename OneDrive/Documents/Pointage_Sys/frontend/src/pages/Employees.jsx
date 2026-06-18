import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Users } from 'lucide-react'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'

const EMPTY = { first_name:'', last_name:'', department:'', position:'', zkteco_uid:'' }
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = n => COLORS[(n||'').charCodeAt(0)%COLORS.length]
const initials = (f,l) => ((f?.[0]??'')+(l?.[0]??'')).toUpperCase()

export default function Employees() {
  const { t } = useTheme()
  const [employees, setEmployees] = useState([])
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/employees')
      setEmployees(Array.isArray(r.data) ? r.data : (r.data.data??[]))
    } catch {} finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = e => { setForm({...e}); setEditing(e.id); setError(''); setShowModal(true) }
  const save = async () => {
    try {
      editing ? await api.put(`/employees/${editing}`,form) : await api.post('/employees',form)
      setShowModal(false); load()
    } catch(e){ setError(e.response?.data?.message??'Erreur') }
  }
  const remove = async id => {
    if(!confirm('Supprimer cet employé ?')) return
    await api.delete(`/employees/${id}`).catch(()=>{})
    load()
  }

  const filtered = employees.filter(e =>
    (e.first_name+' '+e.last_name+' '+(e.department||'')).toLowerCase().includes(search.toLowerCase())
  )

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const inp = (extra={}) => ({ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:'8px', border:'1.5px solid '+t.border, background:t.bg, color:t.text, fontSize:'13px', outline:'none', ...extra })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>Employés</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>{employees.length} employé{employees.length!==1?'s':''} enregistré{employees.length!==1?'s':''}</p>
        </div>
        <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 18px', borderRadius:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
          <Plus size={15}/> Ajouter
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:t.textFaint, pointerEvents:'none' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un employé..."
          style={{ ...inp(), paddingLeft:'36px', maxWidth:'320px' }}
          onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}
        />
      </div>

      {/* Table */}
      <div style={card({overflow:'hidden'})}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>Chargement...</div>
        ) : filtered.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>
            <Users size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
            {search ? 'Aucun résultat' : 'Aucun employé enregistré'}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {['Employé','Département','Poste','UID ZKTeco','Actions'].map(h=>(
                    <th key={h} style={{ padding:'11px 20px', textAlign:h==='Actions'?'right':'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
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
                        <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:colorFor(emp.first_name), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'13px', flexShrink:0 }}>
                          {initials(emp.first_name,emp.last_name)}
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:500, color:t.text }}>{emp.first_name} {emp.last_name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 20px', fontSize:'13px', color:t.textMuted }}>{emp.department||'—'}</td>
                    <td style={{ padding:'13px 20px', fontSize:'13px', color:t.textMuted }}>{emp.position||'—'}</td>
                    <td style={{ padding:'13px 20px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:'6px', background:t.primaryBg, color:t.primary, fontSize:'12px', fontWeight:600, fontFamily:'monospace' }}>
                        {emp.zkteco_uid||'—'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 20px', textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
                        <button onClick={()=>openEdit(emp)} style={{ padding:'5px 10px', borderRadius:'7px', background:t.primaryBg, border:'1px solid '+t.primaryBorder, color:t.primary, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                          <Pencil size={12}/> Modifier
                        </button>
                        <button onClick={()=>remove(emp.id)} style={{ padding:'5px 10px', borderRadius:'7px', background:t.badge.absent.bg, border:'1px solid rgba(220,38,38,0.2)', color:t.red, fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                          <Trash2 size={12}/> Suppr.
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
          <div style={{ background:t.surface, border:'1px solid '+t.border, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'480px', boxShadow:'0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <h3 style={{ fontSize:'17px', fontWeight:700, color:t.text, margin:0 }}>{editing?'Modifier l\'employé':'Ajouter un employé'}</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:t.textMuted, display:'flex' }}><X size={20}/></button>
            </div>
            {error && <div style={{ padding:'10px 14px', borderRadius:'8px', background:t.badge.absent.bg, color:t.red, fontSize:'13px', marginBottom:'16px', border:'1px solid rgba(220,38,38,0.2)' }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              {[['first_name','Prénom'],['last_name','Nom']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              {[['department','Département'],['position','Poste']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inp()}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:t.textMuted, marginBottom:'5px' }}>UID ZKTeco</label>
              <input value={form.zkteco_uid||''} onChange={e=>setForm(p=>({...p,zkteco_uid:e.target.value}))} style={inp()}
                onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 18px', borderRadius:'8px', background:'none', border:'1px solid '+t.border, color:t.textMuted, fontSize:'13px', fontWeight:500, cursor:'pointer' }}>Annuler</button>
              <button onClick={save} style={{ padding:'9px 18px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>{editing?'Enregistrer':'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

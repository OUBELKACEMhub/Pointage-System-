import { useEffect, useState, useCallback } from 'react'
import { Search, CalendarCheck, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'
import { useTheme } from '../context/ThemeContext'

const fmtDate  = s => s ? String(s).slice(0,10) : '—'
const fmtHHMM  = s => s ? String(s).replace('T',' ').slice(11,16) : '—'
const fmtFull  = s => s ? String(s).replace('T',' ').slice(0,16)  : '—'

export default function Attendance() {
  const { t } = useTheme()
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [meta,     setMeta]     = useState(null)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async (p=1) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (search)   params.employee = search
      if (dateFrom) params.from     = dateFrom
      if (dateTo)   params.to       = dateTo
      const r = await api.get('/attendance', { params })
      setRows(r.data.data ?? [])
      setMeta(r.data)
      setPage(p)
    } catch {} finally { setLoading(false) }
  }, [search, dateFrom, dateTo])

  useEffect(() => { load(1) }, [load])

  const toggleExpand = id => setExpanded(prev => prev===id ? null : id)

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })
  const inp  = (extra={}) => ({ padding:'8px 12px', borderRadius:'8px', border:'1px solid '+t.border, background:t.surface, color:t.text, fontSize:'13px', outline:'none', ...extra })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>Suivi Quotidien</h1>
        <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>Historique des pointages et statuts de présence</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1', minWidth:'200px', maxWidth:'280px' }}>
          <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:t.textFaint, pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un employé..."
            style={{ ...inp(), width:'100%', boxSizing:'border-box', paddingLeft:'32px' }}
            onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}
          />
        </div>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inp()}
          onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
        <span style={{ color:t.textFaint, fontSize:'12px' }}>→</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inp()}
          onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor=t.border}/>
        {(search||dateFrom||dateTo) && (
          <button onClick={()=>{ setSearch(''); setDateFrom(''); setDateTo('') }}
            style={{ padding:'8px 14px', borderRadius:'8px', background:'none', border:'1px solid '+t.border, color:t.textMuted, fontSize:'12px', cursor:'pointer' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div style={card({overflow:'hidden'})}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>Chargement...</div>
        ) : rows.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>
            <CalendarCheck size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
            Aucun enregistrement trouvé
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {['Employé','Date','Entrée','Sortie','Durée','Statut','Détails'].map(h=>(
                    <th key={h} style={{ padding:'11px 18px', textAlign:'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const isExp = expanded===row.id
                  const scans = row.scans ?? []
                  return [
                    <tr key={row.id} style={{ borderBottom:isExp?'none':'1px solid '+t.border, transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'13px 18px' }}>
                        <span style={{ fontSize:'13px', fontWeight:500, color:t.text }}>
                          {row.employee?.first_name} {row.employee?.last_name}
                        </span>
                        {row.employee?.department && (
                          <div style={{ fontSize:'11px', color:t.textFaint, marginTop:'2px' }}>{row.employee.department}</div>
                        )}
                      </td>
                      <td style={{ padding:'13px 18px', fontSize:'13px', color:t.text, fontVariantNumeric:'tabular-nums' }}>{fmtDate(row.work_date)}</td>
                      <td style={{ padding:'13px 18px', fontSize:'13px', fontWeight:600, color:t.green, fontVariantNumeric:'tabular-nums' }}>{fmtHHMM(row.check_in)}</td>
                      <td style={{ padding:'13px 18px', fontSize:'13px', fontWeight:600, color:t.red,   fontVariantNumeric:'tabular-nums' }}>{fmtHHMM(row.check_out)}</td>
                      <td style={{ padding:'13px 18px', fontSize:'13px', color:t.textMuted, fontVariantNumeric:'tabular-nums' }}>
                        {row.worked_hours ?? '—'}
                      </td>
                      <td style={{ padding:'13px 18px' }}><Badge status={row.status}/></td>
                      <td style={{ padding:'13px 18px' }}>
                        {scans.length>0 && (
                          <button onClick={()=>toggleExpand(row.id)}
                            style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'6px', background:t.primaryBg, border:'1px solid '+t.primaryBorder, color:t.primary, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                            <Clock size={11}/> {scans.length} scan{scans.length>1?'s':''}
                            {isExp ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                          </button>
                        )}
                      </td>
                    </tr>,
                    isExp && (
                      <tr key={'exp-'+row.id} style={{ borderBottom:'1px solid '+t.border }}>
                        <td colSpan={7} style={{ padding:'0 18px 14px 18px' }}>
                          <div style={{ background:t.bg, borderRadius:'8px', padding:'12px 16px', border:'1px solid '+t.border }}>
                            <div style={{ fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'10px' }}>
                              Chronologie des pointages
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                              {scans.map((sc,i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'20px', background:t.surface, border:'1px solid '+t.border, fontSize:'12px', color:t.text }}>
                                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: i===0?t.green : i===scans.length-1?t.red : t.primary, flexShrink:0 }}/>
                                  <span style={{ fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{fmtHHMM(sc)}</span>
                                  <span style={{ color:t.textFaint, fontSize:'10px' }}>{i===0?'Entrée':i===scans.length-1&&scans.length>1?'Sortie':'Scan '+(i+1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  ].filter(Boolean)
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <span style={{ fontSize:'13px', color:t.textMuted }}>
            {meta.from}–{meta.to} sur {meta.total} enregistrements
          </span>
          <div style={{ display:'flex', gap:'6px' }}>
            <button onClick={()=>load(page-1)} disabled={page<=1}
              style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:page<=1?t.textFaint:t.text, fontSize:'12px', cursor:page<=1?'not-allowed':'pointer', opacity:page<=1?0.5:1 }}>
              <ChevronLeft size={14}/> Précédent
            </button>
            {Array.from({length:Math.min(5,meta.last_page)},(_,i)=>{
              const p = meta.last_page<=5 ? i+1 : page<=3 ? i+1 : page>=meta.last_page-2 ? meta.last_page-4+i : page-2+i
              return (
                <button key={p} onClick={()=>load(p)}
                  style={{ width:'34px', height:'34px', borderRadius:'8px', border:'1px solid '+(p===page?t.primary:t.border), background:p===page?t.primaryBg:'none', color:p===page?t.primary:t.textMuted, fontSize:'13px', fontWeight:p===page?700:400, cursor:'pointer' }}>
                  {p}
                </button>
              )
            })}
            <button onClick={()=>load(page+1)} disabled={page>=meta.last_page}
              style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:page>=meta.last_page?t.textFaint:t.text, fontSize:'12px', cursor:page>=meta.last_page?'not-allowed':'pointer', opacity:page>=meta.last_page?0.5:1 }}>
              Suivant <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

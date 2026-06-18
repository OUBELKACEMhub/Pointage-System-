import { useState, useEffect, useCallback } from 'react'
import { Download, FileBarChart2, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/client'

const fmtH = m => m ? Math.floor(m/60)+'h'+String(m%60).padStart(2,'0') : '0h00'

function exportCSV(data, month) {
  const rows = ['Employé;Département;Présents;En retard;Absents;Total heures',
    ...data.map(r=>`${r.name};${r.department??''};${r.present};${r.late};${r.absent};${fmtH(r.total_minutes)}`)
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff'+rows], {type:'text/csv;charset=utf-8'}))
  a.download = `rapport_${month}.csv`
  a.click()
}

const StatusPill = ({ n, color }) => (
  <span style={{ display:'inline-block', minWidth:'28px', textAlign:'center', padding:'2px 8px', borderRadius:'20px', background:color+'18', color, fontSize:'12px', fontWeight:600 }}>{n}</span>
)

export default function Reports() {
  const { t } = useTheme()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [month,   setMonth]   = useState(defaultMonth)
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async m => {
    setLoading(true)
    try { const r = await api.get('/reports/monthly',{params:{month:m}}); setData(r.data.data??[]) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(()=>{ load(month) },[month])

  const card = (extra={}) => ({ background:t.surface, border:'1px solid '+t.border, borderRadius:'14px', ...extra })

  const totPresent = data.reduce((s,r)=>s+r.present,0)
  const totLate    = data.reduce((s,r)=>s+r.late,0)
  const totAbsent  = data.reduce((s,r)=>s+r.absent,0)
  const totMin     = data.reduce((s,r)=>s+(r.total_minutes??0),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>Rapports Mensuels</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>Récapitulatif des présences par employé</p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid '+t.border, background:t.surface, color:t.text, fontSize:'13px', outline:'none', cursor:'pointer' }}
          />
          <button onClick={()=>load(month)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:t.textMuted, fontSize:'13px', cursor:'pointer' }}>
            <RefreshCw size={14}/>
          </button>
          {data.length>0 && (
            <button onClick={()=>exportCSV(data,month)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              <Download size={14}/> Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {data.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'14px' }}>
          {[
            { label:'Présences', value:totPresent, color:'#16a34a' },
            { label:'Retards',   value:totLate,    color:'#d97706' },
            { label:'Absences',  value:totAbsent,  color:'#dc2626' },
            { label:'Total heures', value:fmtH(totMin), color:'#6366f1' },
          ].map(({label,value,color})=>(
            <div key={label} style={{ background:t.surface, border:'1px solid '+t.border, borderRadius:'12px', padding:'16px' }}>
              <div style={{ fontSize:'22px', fontWeight:700, color, marginBottom:'4px' }}>{value}</div>
              <div style={{ fontSize:'12px', color:t.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={card({overflow:'hidden'})}>
        {loading ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>Chargement...</div>
        ) : data.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>
            <FileBarChart2 size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
            Aucune donnée pour cette période
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {['Employé','Département','Présents','En retard','Absents','Heures travaillées'].map(h=>(
                    <th key={h} style={{ padding:'11px 18px', textAlign:['Présents','En retard','Absents','Heures travaillées'].includes(h)?'center':'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row=>(
                  <tr key={row.employee_id} style={{ borderBottom:'1px solid '+t.border, transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 18px', fontSize:'13px', fontWeight:500, color:t.text }}>{row.name}</td>
                    <td style={{ padding:'12px 18px', fontSize:'13px', color:t.textMuted }}>{row.department||'—'}</td>
                    <td style={{ padding:'12px 18px', textAlign:'center' }}><StatusPill n={row.present} color="#16a34a"/></td>
                    <td style={{ padding:'12px 18px', textAlign:'center' }}><StatusPill n={row.late}    color="#d97706"/></td>
                    <td style={{ padding:'12px 18px', textAlign:'center' }}><StatusPill n={row.absent}  color="#dc2626"/></td>
                    <td style={{ padding:'12px 18px', textAlign:'center', fontSize:'13px', fontWeight:600, color:t.text, fontVariantNumeric:'tabular-nums' }}>{fmtH(row.total_minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

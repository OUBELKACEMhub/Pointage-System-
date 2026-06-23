import { useState, useEffect, useCallback } from 'react'
import { Download, FileBarChart2, RefreshCw, FileText } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLang } from '../context/LanguageContext'
import api from '../api/client'

const fmtH = m => m ? Math.floor(m/60)+'h'+String(m%60).padStart(2,'0') : '0h00'

function exportCSV(data, month) {
  const rows = ['Employe;Departement;Presents;En retard;Absents;Heures travaillees;Heures sup',
    ...data.map(r=>`${r.name};${r.department??''};${r.present};${r.late};${r.absent};${fmtH(r.total_minutes)};${fmtH(r.overtime_minutes??0)}`)
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿'+rows], {type:'text/csv;charset=utf-8'}))
  a.download = `rapport_${month}.csv`
  a.click()
}

async function exportPDF(data, month) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241)
  doc.text('ZKPointe', 14, 18)
  doc.setFontSize(12)
  doc.setTextColor(80)
  doc.text(`Rapport mensuel — ${month}`, 14, 26)
  doc.setFontSize(9)
  doc.setTextColor(130)
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 14, 32)

  const totPresent  = data.reduce((s,r)=>s+r.present, 0)
  const totLate     = data.reduce((s,r)=>s+r.late, 0)
  const totAbsent   = data.reduce((s,r)=>s+r.absent, 0)
  const totMin      = data.reduce((s,r)=>s+(r.total_minutes??0), 0)
  const totOvertMin = data.reduce((s,r)=>s+(r.overtime_minutes??0), 0)
  doc.text(
    `${data.length} employes  |  ${totPresent} presences  |  ${totLate} retards  |  ${totAbsent} absences  |  ${fmtH(totMin)} total  |  ${fmtH(totOvertMin)} sup`,
    14, 40
  )

  autoTable(doc, {
    startY: 46,
    head: [['Employe', 'Departement', 'Presents', 'En retard', 'Absents', 'Heures trav.', 'Heures sup.']],
    body: data.map(r => [r.name, r.department||'—', r.present, r.late, r.absent, fmtH(r.total_minutes), fmtH(r.overtime_minutes??0)]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  })

  doc.save(`rapport_${month}.pdf`)
}

const StatusPill = ({ n, color }) => (
  <span style={{ display:'inline-block', minWidth:'28px', textAlign:'center', padding:'2px 8px', borderRadius:'20px', background:color+'18', color, fontSize:'12px', fontWeight:600 }}>{n}</span>
)

export default function Reports() {
  const { t } = useTheme()
  const { tr } = useLang()
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
  const totOvMin   = data.reduce((s,r)=>s+(r.overtime_minutes??0),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:700, color:t.text, margin:0, letterSpacing:'-0.5px' }}>{tr.reportsTitle}</h1>
          <p style={{ color:t.textMuted, fontSize:'13px', marginTop:'4px' }}>{tr.reportsSub}</p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid '+t.border, background:t.surface, color:t.text, fontSize:'13px', outline:'none', cursor:'pointer' }}
          />
          <button onClick={()=>load(month)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:t.textMuted, fontSize:'13px', cursor:'pointer' }}>
            <RefreshCw size={14}/>
          </button>
          {data.length>0 && (
            <>
              <button onClick={()=>exportCSV(data,month)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'8px', background:t.surface, border:'1px solid '+t.border, color:t.text, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                <Download size={14}/> {tr.exportCSV}
              </button>
              <button onClick={()=>exportPDF(data,month)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                <FileText size={14}/> {tr.exportPDF}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {data.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'14px' }}>
          {[
            { label:tr.statusPresent, value:totPresent,    color:'#16a34a' },
            { label:tr.statusLate,    value:totLate,       color:'#d97706' },
            { label:tr.statusAbsent,  value:totAbsent,     color:'#dc2626' },
            { label:tr.totalHours,    value:fmtH(totMin),  color:'#6366f1' },
            { label:tr.overtime,      value:fmtH(totOvMin),color:'#f59e0b' },
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
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>{tr.saving?.replace('...','') || 'Chargement'}...</div>
        ) : data.length===0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:t.textFaint }}>
            <FileBarChart2 size={32} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
            {tr.noData}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid '+t.border }}>
                  {[tr.employee, tr.department, tr.statusPresent, tr.statusLate, tr.statusAbsent, tr.hoursWorked, tr.overtime].map(h=>(
                    <th key={h} style={{ padding:'11px 18px', textAlign:[tr.statusPresent,tr.statusLate,tr.statusAbsent,tr.hoursWorked,tr.overtime].includes(h)?'center':'left', fontSize:'11px', fontWeight:700, color:t.textFaint, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
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
                    <td style={{ padding:'12px 18px', textAlign:'center', fontSize:'13px', fontWeight:600, fontVariantNumeric:'tabular-nums',
                      color: row.overtime_minutes > 0 ? '#f59e0b' : t.textFaint }}>
                      {row.overtime_minutes > 0 ? fmtH(row.overtime_minutes) : '—'}
                    </td>
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

import { useState } from 'react'
import { Download, FileSpreadsheet, FileBarChart2, TrendingUp } from 'lucide-react'
import Badge from '../components/Badge'

const MOCK = [
  { name: 'Ahmed Oubelkacem', present: 18, late: 4, absent: 0, total_minutes: 9720 },
  { name: 'Admin .',          present: 14, late: 6, absent: 2, total_minutes: 7560 },
  { name: 'Owr .',            present: 10, late: 8, absent: 4, total_minutes: 5400 },
]

function fmtH(m) { return `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}` }

function exportCSV(data, month) {
  const rows = ['Employé;Présents;En retard;Absents;Total heures', ...data.map(r =>
    `${r.name};${r.present};${r.late};${r.absent};${fmtH(r.total_minutes)}`
  )].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + rows], { type: 'text/csv;charset=utf-8' }))
  a.download = `rapport_${month}.csv`
  a.click()
}

const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '9px 14px', color: '#fff', fontSize: '14px', outline: 'none',
}

export default function Reports() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [month, setMonth] = useState(defaultMonth)

  const totalMinutes = MOCK.reduce((s, r) => s + r.total_minutes, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Rapports Mensuels</h2>
        <p className="text-slate-400 mt-1">Récapitulatif des heures travaillées — prêt pour la paie</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Heures totales', value: fmtH(totalMinutes), color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
          { label: 'Employés actifs', value: MOCK.length,       color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Moy. heures/emp', value: fmtH(Math.round(totalMinutes / MOCK.length)), color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-end" style={cardStyle}>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Mois du rapport</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle} />
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => exportCSV(MOCK, month)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
            <FileSpreadsheet size={15} /> Exporter CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
            <Download size={15} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <FileBarChart2 size={18} className="text-indigo-400" />
          <h3 className="font-semibold text-white">Bilan — {month}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Employé', 'Jours présent', 'En retard', 'Absents', 'Total heures', 'Assiduité'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK.map((r, i) => {
              const total = r.present + r.late + r.absent
              const rate = Math.round(((r.present + r.late) / total) * 100)
              return (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: i < MOCK.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-6 py-4 font-medium text-white">{r.name}</td>
                  <td className="px-6 py-4"><Badge status="present" /><span className="ml-2 text-white text-sm">{r.present}j</span></td>
                  <td className="px-6 py-4"><Badge status="late"    /><span className="ml-2 text-white text-sm">{r.late}j</span></td>
                  <td className="px-6 py-4"><Badge status="absent"  /><span className="ml-2 text-white text-sm">{r.absent}j</span></td>
                  <td className="px-6 py-4 font-bold" style={{ color: '#a5b4fc' }}>{fmtH(r.total_minutes)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-300 w-8">{rate}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 flex items-center gap-1.5">
        <TrendingUp size={12} />
        Les données affichées sont des exemples — connectez l'agrégation mensuelle via l'API Laravel pour les données réelles.
      </p>
    </div>
  )
}

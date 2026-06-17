import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import Badge from '../components/Badge'

const MOCK_REPORT = [
  { name: 'Karim Benali',    present: 20, late: 2, absent: 0, total_minutes: 10500 },
  { name: 'Amina Tazi',      present: 18, late: 3, absent: 1, total_minutes:  9720 },
  { name: 'Youssef El Kari', present: 15, late: 1, absent: 6, total_minutes:  8100 },
]

function fmtH(m) {
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

function exportCSV(data, month) {
  const header = 'Employé;Jours Présent;En Retard;Absents;Total Heures\n'
  const rows = data.map(r =>
    `${r.name};${r.present};${r.late};${r.absent};${fmtH(r.total_minutes)}`
  ).join('\n')
  const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `rapport_pointage_${month}.csv`
  a.click()
}

export default function Reports() {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Rapports Mensuels</h2>
          <p className="text-slate-500 text-sm mt-1">Récapitulatif des heures travaillées par employé</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Mois</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button
          onClick={() => exportCSV(MOCK_REPORT, month)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <FileSpreadsheet size={16} /> Exporter CSV
        </button>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Download size={16} /> Exporter PDF
        </button>
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">Bilan — {month}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              {['Employé', 'Jours Présent', 'En Retard', 'Absents', 'Total Heures'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_REPORT.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-3"><Badge status="present" /><span className="ml-2 text-slate-700">{r.present}j</span></td>
                <td className="px-4 py-3"><Badge status="late" /><span className="ml-2 text-slate-700">{r.late}j</span></td>
                <td className="px-4 py-3"><Badge status="absent" /><span className="ml-2 text-slate-700">{r.absent}j</span></td>
                <td className="px-4 py-3 font-semibold text-slate-700">{fmtH(r.total_minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">* Les données affichées sont des exemples. Connectez le backend Laravel pour les données réelles.</p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'

const MOCK = [
  { id: 1, employee: { first_name: 'Karim',   last_name: 'Benali'  }, work_date: '2026-06-17', check_in: '08:31:00', check_out: '17:28:00', worked_minutes: 537, status: 'present' },
  { id: 2, employee: { first_name: 'Amina',   last_name: 'Tazi'    }, work_date: '2026-06-17', check_in: '08:47:00', check_out: '17:35:00', worked_minutes: 528, status: 'late' },
  { id: 3, employee: { first_name: 'Youssef', last_name: 'El Kari' }, work_date: '2026-06-17', check_in: null,       check_out: null,       worked_minutes: null, status: 'absent' },
]

function fmtMinutes(m) {
  if (!m) return '—'
  return `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`
}

export default function Attendance() {
  const [rows,   setRows]   = useState([])
  const [search, setSearch] = useState('')
  const [from,   setFrom]   = useState(new Date().toISOString().slice(0, 10))
  const [to,     setTo]     = useState(new Date().toISOString().slice(0, 10))

  const load = () =>
    api.get('/attendance', { params: { from, to, employee: search || undefined } })
      .then(r => setRows(r.data.data ?? r.data))
      .catch(() => setRows(MOCK))

  useEffect(() => { load() }, [from, to])

  const filtered = rows.filter(r =>
    !search ||
    `${r.employee?.first_name} ${r.employee?.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">Suivi Quotidien</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1">Recherche</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom de l'employé…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Filter size={15} /> Filtrer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              {['Employé', 'Date', 'Entrée', 'Sortie', 'Durée', 'Statut'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(row => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {row.employee?.first_name} {row.employee?.last_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.work_date}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{row.check_in?.slice(0, 5) ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{row.check_out?.slice(0, 5) ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{fmtMinutes(row.worked_minutes)}</td>
                <td className="px-4 py-3"><Badge status={row.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun enregistrement trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

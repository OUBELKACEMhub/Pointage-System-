import { useEffect, useState } from 'react'
import { Search, SlidersHorizontal, CalendarCheck } from 'lucide-react'
import api from '../api/client'
import Badge from '../components/Badge'

function fmtMin(m) {
  if (!m) return '—'
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '9px 14px', color: '#fff', fontSize: '14px', outline: 'none',
}

export default function Attendance() {
  const today = new Date().toISOString().slice(0, 10)
  const [rows,   setRows]   = useState([])
  const [search, setSearch] = useState('')
  const [from,   setFrom]   = useState(today)
  const [to,     setTo]     = useState(today)
  const [loading,setLoading]= useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/attendance', { params: { from, to } })
      setRows(r.data.data ?? r.data)
    } catch { setRows([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [from, to])

  const filtered = rows.filter(r =>
    !search || `${r.employee?.first_name} ${r.employee?.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  const counts = filtered.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc }, {})

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Suivi Quotidien</h2>
        <p className="text-slate-400 mt-1">Historique des présences par employé</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Présents',   value: counts.present ?? 0, color: '#34d399', bg: 'rgba(16,185,129,0.12)'  },
          { label: 'En retard',  value: counts.late    ?? 0, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)'  },
          { label: 'Absents',    value: counts.absent  ?? 0, color: '#f87171', bg: 'rgba(239,68,68,0.12)'   },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-5 py-4 text-center" style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1 text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-3 items-end" style={cardStyle}>
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            style={{ ...inputStyle, width: '100%', paddingLeft: '38px' }} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Du</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Au</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <SlidersHorizontal size={15} /> Filtrer
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <CalendarCheck size={18} className="text-indigo-400" />
          <h3 className="font-semibold text-white">Résultats</h3>
          <span className="ml-auto text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {filtered.length} ligne(s)
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Employé', 'Date', 'Entrée', 'Sortie', 'Durée', 'Statut'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-6 py-4 font-medium text-white text-sm">
                    {row.employee?.first_name} {row.employee?.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{row.work_date}</td>
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: row.check_in ? '#34d399' : '#475569' }}>
                    {row.check_in?.slice(0, 5) ?? '—'}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: row.check_out ? '#60a5fa' : '#475569' }}>
                    {row.check_out?.slice(0, 5) ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: row.worked_minutes ? '#fff' : '#475569' }}>
                    {fmtMin(row.worked_minutes)}
                  </td>
                  <td className="px-6 py-4"><Badge status={row.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                  Aucun enregistrement pour cette période.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'
import api from '../api/client'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

const MOCK_STATS = { total: 12, present: 7, late: 2, absent: 3, date: new Date().toISOString().slice(0, 10) }
const MOCK_FEED = [
  { id: 1, full_name: 'Karim Benali',   department: 'Informatique', punched_at: '2026-06-17T08:31:00Z' },
  { id: 2, full_name: 'Amina Tazi',     department: 'RH',           punched_at: '2026-06-17T08:45:00Z' },
  { id: 3, full_name: 'Youssef El Kari',department: 'Finance',      punched_at: '2026-06-17T09:02:00Z' },
]

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [feed]  = useState(MOCK_FEED)

  useEffect(() => {
    api.get('/dashboard/today')
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
  }, [])

  const s = stats ?? MOCK_STATS

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Employés"  value={s.total}   color="blue"   icon={Users} />
        <StatCard label="Présents"        value={s.present} color="green"  icon={UserCheck} />
        <StatCard label="En retard"       value={s.late}    color="yellow" icon={Clock} />
        <StatCard label="Absents"         value={s.absent}  color="red"    icon={UserX} />
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold text-slate-700">Flux en temps réel</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {feed.map(entry => (
            <li key={entry.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{entry.full_name}</p>
                <p className="text-xs text-slate-400">{entry.department}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{fmtTime(entry.punched_at)}</p>
                <Badge status="present" />
              </div>
            </li>
          ))}
          {feed.length === 0 && (
            <li className="px-5 py-8 text-center text-slate-400 text-sm">Aucun pointage aujourd'hui</li>
          )}
        </ul>
      </div>
    </div>
  )
}

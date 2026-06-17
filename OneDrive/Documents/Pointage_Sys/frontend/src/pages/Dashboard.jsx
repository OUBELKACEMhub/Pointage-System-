import { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, Clock, UserX, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import api from '../api/client'
import StatCard from '../components/StatCard'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length]

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [feed,    setFeed]    = useState([])
  const [loading, setLoading] = useState(true)
  const [online,  setOnline]  = useState(true)
  const [lastSync,setLastSync]= useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f] = await Promise.all([
        api.get('/dashboard/today'),
        api.get('/dashboard/live-feed'),
      ])
      setStats(s.data)
      setFeed(f.data)
      setOnline(true)
      setLastSync(new Date())
    } catch {
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Tableau de bord</h2>
          <p className="text-slate-400 mt-1 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: online ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: online ? '#34d399' : '#f87171' }}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'API connectée' : 'Hors ligne'}
          </div>
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lastSync ? fmtTime(lastSync) : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Employés" value={stats?.total}   color="blue"   icon={Users} />
        <StatCard label="Présents"        value={stats?.present} color="green"  icon={UserCheck} />
        <StatCard label="En retard"       value={stats?.late}    color="yellow" icon={Clock} />
        <StatCard label="Absents"         value={stats?.absent}  color="red"    icon={UserX} />
      </div>

      {/* Attendance bar */}
      {stats && stats.total > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">Taux de présence aujourd'hui</p>
            <p className="text-sm font-bold text-white">
              {Math.round(((stats.present + stats.late) / stats.total) * 100)}%
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${((stats.present + stats.late) / stats.total) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }} />
          </div>
          <div className="flex gap-4 mt-3">
            {[
              { label: 'Présents', value: stats.present, color: '#34d399' },
              { label: 'En retard', value: stats.late,   color: '#fbbf24' },
              { label: 'Absents',  value: stats.absent,  color: '#f87171' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.label} : <span className="font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Feed */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 absolute inset-0 animate-ping opacity-60" />
            </div>
            <h3 className="font-semibold text-white">Flux de pointages — ZKTeco</h3>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            {feed.length} pointage(s)
          </span>
        </div>

        {loading && feed.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Connexion à la base de données…</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            Aucun pointage enregistré.
          </div>
        ) : (
          <ul>
            {feed.map((entry, i) => (
              <li key={entry.id}
                className="px-6 py-3.5 flex items-center gap-4 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < feed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: colorFor(entry.full_name) }}>
                  {initials(entry.full_name)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{entry.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{entry.department ?? 'Département non défini'}</p>
                </div>
                {/* Time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">{fmtTime(entry.punched_at)}</p>
                  <p className="text-xs text-slate-500">{fmtDate(entry.punched_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

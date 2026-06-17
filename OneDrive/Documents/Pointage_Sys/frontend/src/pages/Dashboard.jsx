import { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, Clock, UserX, RefreshCw } from 'lucide-react'
import api from '../api/client'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [feed,     setFeed]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [lastSync, setLastSync] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, feedRes] = await Promise.all([
        api.get('/dashboard/today'),
        api.get('/dashboard/live-feed'),
      ])
      setStats(statsRes.data)
      setFeed(feedRes.data)
      setLastSync(new Date())
    } catch (e) {
      setError('Impossible de joindre le serveur Laravel. Vérifiez que php artisan serve tourne sur le port 8000.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Chargement initial + rafraîchissement automatique toutes les 30s
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {lastSync ? `Mis à jour à ${fmtTime(lastSync)}` : 'Actualiser'}
        </button>
      </div>

      {/* Erreur de connexion */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Employés" value={stats?.total}   color="blue"   icon={Users} />
        <StatCard label="Présents"        value={stats?.present} color="green"  icon={UserCheck} />
        <StatCard label="En retard"       value={stats?.late}    color="yellow" icon={Clock} />
        <StatCard label="Absents"         value={stats?.absent}  color="red"    icon={UserX} />
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-semibold text-slate-700">Derniers pointages (machine ZKTeco)</h3>
          </div>
          <span className="text-xs text-slate-400">{feed.length} enregistrement(s)</span>
        </div>

        {loading && feed.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Chargement…</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {feed.map(entry => (
              <li key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{entry.full_name}</p>
                  <p className="text-xs text-slate-400">{entry.department ?? 'Non défini'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{fmtTime(entry.punched_at)}</p>
                  <p className="text-xs text-slate-400">{fmtDate(entry.punched_at)}</p>
                </div>
              </li>
            ))}
            {feed.length === 0 && !loading && (
              <li className="px-5 py-8 text-center text-slate-400 text-sm">
                Aucun pointage trouvé en base de données.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

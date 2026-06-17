import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Clock } from 'lucide-react'
import api from '../api/client'

const EMPTY = { name: 'Horaire standard', start_time: '08:30', end_time: '17:30', tolerance_minutes: 15, is_active: true }
const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none',
}

export default function Schedules() {
  const [schedules, setSchedules] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [error,     setError]     = useState('')

  const load = () => api.get('/schedules').then(r => setSchedules(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = (s) => { setForm({ ...s, start_time: s.start_time?.slice(0, 5), end_time: s.end_time?.slice(0, 5) }); setEditing(s.id); setError(''); setShowModal(true) }
  const save = async () => {
    try {
      editing ? await api.put(`/schedules/${editing}`, form) : await api.post('/schedules', form)
      setShowModal(false); load()
    } catch (e) { setError(e.response?.data?.message ?? 'Erreur') }
  }
  const remove = async (id) => {
    if (!confirm('Supprimer ?')) return
    await api.delete(`/schedules/${id}`).catch(() => {})
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestion des Horaires</h2>
          <p className="text-slate-400 mt-1">Configurez les plages de travail et la tolérance de retard</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Ajouter un horaire
        </button>
      </div>

      <div className="space-y-4">
        {schedules.map(s => (
          <div key={s.id} className="rounded-2xl p-6 flex items-center justify-between group transition-all hover:border-indigo-500/30"
            style={cardStyle}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Clock size={22} className="text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold text-white text-lg">{s.name}</p>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={s.is_active
                      ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                      : { background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>
                    {s.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-300">
                    <span className="text-slate-500">Début : </span>
                    <span className="font-mono font-semibold">{s.start_time?.slice(0, 5)}</span>
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-300">
                    <span className="text-slate-500">Fin : </span>
                    <span className="font-mono font-semibold">{s.end_time?.slice(0, 5)}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                    Tolérance : {s.tolerance_minutes} min
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(s)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                <Pencil size={15} />
              </button>
              <button onClick={() => remove(s.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="rounded-2xl py-12 text-center text-slate-500" style={cardStyle}>
            Aucun horaire configuré
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl p-4 text-sm flex items-start gap-3"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
        <span className="text-lg">💡</span>
        <p>Un employé arrivant dans les <strong>{schedules[0]?.tolerance_minutes ?? 15} premières minutes</strong> après l'heure de début est marqué <strong>Présent</strong>. Au-delà, il est marqué <strong>En retard</strong>.</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white text-lg">{editing ? 'Modifier' : 'Nouvel'} horaire</h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{error}</div>}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nom de l'horaire</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Heure début</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Heure fin</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Tolérance (minutes)</label>
                <input type="number" min={0} max={60} value={form.tolerance_minutes}
                  onChange={e => setForm(f => ({ ...f, tolerance_minutes: +e.target.value }))} style={inputStyle} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <div className="w-10 h-5 rounded-full transition-colors" style={{ background: form.is_active ? '#6366f1' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.is_active ? '22px' : '2px' }} />
                  </div>
                </div>
                <span className="text-sm text-slate-300">Horaire actif</span>
              </label>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}>Annuler</button>
              <button onClick={save}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Check size={14} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

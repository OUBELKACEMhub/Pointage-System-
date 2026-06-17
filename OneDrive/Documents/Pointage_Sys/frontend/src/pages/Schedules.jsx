import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import api from '../api/client'

const EMPTY = { name: 'Horaire standard', start_time: '08:30', end_time: '17:30', tolerance_minutes: 15, is_active: true }
const MOCK  = [{ id: 1, name: 'Horaire standard', start_time: '08:30', end_time: '17:30', tolerance_minutes: 15, is_active: true }]

export default function Schedules() {
  const [schedules,  setSchedules]  = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState(EMPTY)
  const [editing,    setEditing]    = useState(null)
  const [error,      setError]      = useState('')

  const load = () =>
    api.get('/schedules').then(r => setSchedules(r.data)).catch(() => setSchedules(MOCK))

  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = (s) => { setForm({ ...s, start_time: s.start_time.slice(0,5), end_time: s.end_time.slice(0,5) }); setEditing(s.id); setError(''); setShowModal(true) }

  const save = async () => {
    try {
      if (editing) await api.put(`/schedules/${editing}`, form)
      else         await api.post('/schedules', form)
      setShowModal(false); load()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde')
    }
  }

  const remove = async (id) => {
    if (!confirm('Supprimer cet horaire ?')) return
    await api.delete(`/schedules/${id}`).catch(() => {})
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestion des Horaires</h2>
          <p className="text-slate-500 text-sm mt-1">Définissez les plages horaires et la tolérance de retard</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid gap-4">
        {schedules.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div>
                <p className="font-semibold text-slate-800">{s.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {s.start_time?.slice(0,5)} → {s.end_time?.slice(0,5)}
                  <span className="ml-3 text-yellow-600">Tolérance : {s.tolerance_minutes} min</span>
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil size={16} /></button>
              <button onClick={() => remove(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {schedules.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Aucun horaire configuré</div>
        )}
      </div>

      {/* Explication de la logique */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Logique de statut :</strong> Un employé arrivant dans les {schedules[0]?.tolerance_minutes ?? 15} premières minutes après l'heure de début est marqué <em>Présent</em>. Au-delà, il est marqué <em>En retard</em>.
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">{editing ? 'Modifier' : 'Nouvel'} horaire</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Heure début</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Heure fin</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tolérance (minutes)</label>
                <input type="number" min={0} max={60} value={form.tolerance_minutes}
                  onChange={e => setForm(f => ({ ...f, tolerance_minutes: +e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-700">Horaire actif</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button onClick={save} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                <Check size={15} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

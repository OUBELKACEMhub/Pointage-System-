import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Search, Users } from 'lucide-react'
import api from '../api/client'

const EMPTY = { first_name: '', last_name: '', department: '', position: '', zkteco_uid: '' }
const avatarColors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444']
const colorFor = (name) => avatarColors[(name || '?').charCodeAt(0) % avatarColors.length]
const initials = (f, l) => `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase()

const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none',
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(EMPTY)
  const [editing,   setEditing]   = useState(null)
  const [error,     setError]     = useState('')

  const load = () => api.get('/employees').then(r => setEmployees(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = (e) => { setForm({ ...e }); setEditing(e.id); setError(''); setShowModal(true) }
  const save = async () => {
    try {
      editing ? await api.put(`/employees/${editing}`, form) : await api.post('/employees', form)
      setShowModal(false); load()
    } catch (e) { setError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde') }
  }
  const remove = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return
    await api.delete(`/employees/${id}`).catch(() => {})
    load()
  }

  const filtered = employees.filter(e =>
    !search || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestion des Employés</h2>
          <p className="text-slate-400 mt-1">{employees.length} employé(s) enregistré(s)</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Ajouter un employé
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un employé…"
          style={{ ...inputStyle, paddingLeft: '44px' }} />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Users size={18} className="text-indigo-400" />
          <h3 className="font-semibold text-white">Liste des employés</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Employé', 'Département', 'Poste', 'UID ZKTeco', 'Statut', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <tr key={emp.id}
                className="transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: colorFor(emp.first_name) }}>
                      {initials(emp.first_name, emp.last_name)}
                    </div>
                    <span className="font-medium text-white text-sm">{emp.first_name} {emp.last_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{emp.department ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{emp.position ?? '—'}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    UID: {emp.zkteco_uid}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                    style={emp.is_active
                      ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                      : { background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: emp.is_active ? '#10b981' : '#475569' }} />
                    {emp.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => openEdit(emp)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(emp.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                Aucun employé trouvé
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #0f172a)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white text-lg">{editing ? 'Modifier' : 'Nouvel'} employé</h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: 'first_name', label: 'Prénom *', col: 1 },
                  { field: 'last_name',  label: 'Nom *',    col: 1 },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</label>
                    <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
              </div>
              {[
                { field: 'department', label: 'Département' },
                { field: 'position',   label: 'Poste' },
                { field: 'zkteco_uid', label: 'UID ZKTeco *' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</label>
                  <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                Annuler
              </button>
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

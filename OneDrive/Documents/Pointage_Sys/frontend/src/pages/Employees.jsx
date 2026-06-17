import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import api from '../api/client'

const EMPTY = { first_name: '', last_name: '', department: '', position: '', zkteco_uid: '' }

const MOCK = [
  { id: 1, first_name: 'Karim',   last_name: 'Benali',   department: 'Informatique', position: 'Dev',     zkteco_uid: '1', is_active: true },
  { id: 2, first_name: 'Amina',   last_name: 'Tazi',     department: 'RH',           position: 'Manager', zkteco_uid: '2', is_active: true },
  { id: 3, first_name: 'Youssef', last_name: 'El Kari',  department: 'Finance',      position: 'Comptable',zkteco_uid: '3', is_active: true },
]

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editing, setEditing]     = useState(null)
  const [error, setError]         = useState('')

  const load = () =>
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => setEmployees(MOCK))

  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setError(''); setShowModal(true) }
  const openEdit = (emp) => { setForm({ ...emp }); setEditing(emp.id); setError(''); setShowModal(true) }

  const save = async () => {
    try {
      if (editing) await api.put(`/employees/${editing}`, form)
      else         await api.post('/employees', form)
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde')
    }
  }

  const remove = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return
    await api.delete(`/employees/${id}`).catch(() => {})
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des Employés</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              {['Nom', 'Département', 'Poste', 'UID ZKTeco', 'Statut', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{emp.first_name} {emp.last_name}</td>
                <td className="px-4 py-3 text-slate-600">{emp.department ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{emp.position ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{emp.zkteco_uid}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {emp.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => remove(emp.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun employé enregistré</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-slate-800">{editing ? 'Modifier' : 'Nouvel'} employé</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
              {[
                { field: 'first_name',  label: 'Prénom *' },
                { field: 'last_name',   label: 'Nom *' },
                { field: 'department',  label: 'Département' },
                { field: 'position',    label: 'Poste' },
                { field: 'zkteco_uid',  label: 'UID ZKTeco *' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
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

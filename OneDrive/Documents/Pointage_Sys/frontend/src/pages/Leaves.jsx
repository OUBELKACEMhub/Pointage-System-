import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, CalendarOff, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

const TYPE_COLORS = {
  conge: '#6366f1', maladie: '#ef4444', mission: '#f59e0b', autre: '#64748b',
}

const fmtDate = s => s ? String(s).slice(0, 10) : '—'

const diffDays = (from, to) => {
  if (!from || !to) return 0
  const d = (new Date(to) - new Date(from)) / 86400000
  return Math.max(0, Math.round(d)) + 1
}

export default function Leaves() {
  const { t } = useTheme()
  const { addToast } = useToast()
  const { tr } = useLang()
  const TYPES = {
    conge:   { label: tr.leaveAnnual,  color: '#6366f1' },
    maladie: { label: tr.leaveSick,    color: '#ef4444' },
    mission: { label: tr.leaveMission, color: '#f59e0b' },
    autre:   { label: tr.leaveOther,   color: '#64748b' },
  }

  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [rows,     setRows]     = useState([])
  const [meta,     setMeta]     = useState(null)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [month,    setMonth]    = useState(defaultMonth)
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employee_id: '', date_from: '', date_to: '', type: 'conge', note: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 15 }
      if (month)  params.month    = month
      if (search) params.employee = search
      const r = await api.get('/leaves', { params })
      setRows(r.data.data ?? [])
      setMeta(r.data)
      setPage(p)
    } catch {} finally { setLoading(false) }
  }, [month, search])

  useEffect(() => { load(1) }, [load])

  useEffect(() => {
    api.get('/employees', { params: { per_page: 100 } })
      .then(r => setEmployees(r.data.data ?? r.data ?? []))
      .catch(() => {})
  }, [])

  // Auto-remplir date_to = date_from si vide
  const handleDateFrom = val => {
    setForm(f => ({ ...f, date_from: val, date_to: f.date_to && f.date_to >= val ? f.date_to : val }))
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.employee_id || !form.date_from || !form.date_to) return
    setSaving(true)
    try {
      await api.post('/leaves', form)
      const days = diffDays(form.date_from, form.date_to)
      const tc   = TYPES[form.type]?.label || form.type
      addToast({ title: 'Conge enregistre', body: `${fmtDate(form.date_from)} → ${fmtDate(form.date_to)}  (${days}j) — ${tc}` }, 'info')
      setShowForm(false)
      setForm({ employee_id: '', date_from: '', date_to: '', type: 'conge', note: '' })
      load(1)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement'
      addToast({ title: 'Erreur', body: msg }, 'warning')
    } finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm(tr.confirmLeave)) return
    try {
      await api.delete(`/leaves/${id}`)
      addToast({ title: 'Conge supprime' }, 'warning')
      load(page)
    } catch {}
  }

  const card = (extra = {}) => ({ background: t.surface, border: '1px solid ' + t.border, borderRadius: '14px', ...extra })
  const inp  = (extra = {}) => ({ padding: '8px 12px', borderRadius: '8px', border: '1px solid ' + t.border, background: t.surface, color: t.text, fontSize: '13px', outline: 'none', ...extra })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.5px' }}>{tr.leavesTitle}</h1>
          <p style={{ color: t.textMuted, fontSize: '13px', marginTop: '4px' }}>{tr.leavesSub}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> {tr.newLeave}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={card({ padding: '20px' })}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: t.text, marginBottom: '16px' }}>{tr.newLeave}</h2>
          <form onSubmit={submit}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
              {/* Employe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr.leaveEmployee} *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} required
                  style={inp({ width: '100%' })}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border}>
                  <option value="">{tr.selectEmployee}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr.leaveType}</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={inp()}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Date range row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr.leaveFrom} *</label>
                <input type="date" value={form.date_from} onChange={e => handleDateFrom(e.target.value)} required
                  style={inp()}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border} />
              </div>

              <div style={{ alignSelf: 'flex-end', paddingBottom: '10px', color: t.textFaint, fontSize: '18px' }}>→</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr.leaveTo} *</label>
                <input type="date" value={form.date_to} min={form.date_from || undefined} onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))} required
                  style={inp()}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border} />
              </div>

              {/* Duree calculee */}
              {form.date_from && form.date_to && (
                <div style={{ alignSelf: 'flex-end', paddingBottom: '8px' }}>
                  <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: '20px', background: '#6366f118', color: '#6366f1', fontSize: '13px', fontWeight: 700 }}>
                    {diffDays(form.date_from, form.date_to)} {tr.days}
                  </span>
                </div>
              )}

              {/* Note */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr.leaveNote} ({tr.optional})</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={tr.leaveNote}
                  style={inp({ width: '100%' })}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#6366f1', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? tr.saving : tr.register}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'none', border: '1px solid ' + t.border, color: t.textMuted, fontSize: '13px', cursor: 'pointer' }}>
                {tr.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: t.textFaint, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr.searchEmployee}
            style={{ ...inp(), width: '100%', boxSizing: 'border-box', paddingLeft: '32px' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border} />
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inp()}
          onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = t.border} />
        {(search || month !== defaultMonth) && (
          <button onClick={() => { setSearch(''); setMonth(defaultMonth) }}
            style={{ padding: '8px 14px', borderRadius: '8px', background: 'none', border: '1px solid ' + t.border, color: t.textMuted, fontSize: '12px', cursor: 'pointer' }}>
            {tr.reset}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={card({ overflow: 'hidden' })}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: t.textFaint }}>{tr.saving?.replace('...','') || 'Chargement'}...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: t.textFaint }}>
            <CalendarOff size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            {tr.noLeaves}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid ' + t.border }}>
                  {[tr.leaveEmployee, tr.leaveFrom, tr.leaveTo, tr.leaveDuration, tr.leaveType, tr.leaveNote, tr.leaveAction].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const tc   = TYPES[row.type] || TYPES.autre
                  const days = diffDays(row.date_from, row.date_to)
                  return (
                    <tr key={row.id} style={{ borderBottom: '1px solid ' + t.border, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '13px 18px', fontSize: '13px', fontWeight: 500, color: t.text }}>
                        {row.employee?.first_name} {row.employee?.last_name}
                        {row.employee?.department && (
                          <div style={{ fontSize: '11px', color: t.textFaint, marginTop: '2px' }}>{row.employee.department}</div>
                        )}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: t.text, fontVariantNumeric: 'tabular-nums' }}>{fmtDate(row.date_from)}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: t.text, fontVariantNumeric: 'tabular-nums' }}>{fmtDate(row.date_to)}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', background: '#6366f118', color: '#6366f1', fontSize: '12px', fontWeight: 600 }}>
                          {days} {tr.days}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', background: tc.color + '18', color: tc.color, fontSize: '12px', fontWeight: 600 }}>
                          {tc.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: t.textMuted }}>{row.note || '—'}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <button onClick={() => remove(row.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: '#ef444418', border: '1px solid #ef444430', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          <Trash2 size={11} /> {tr.delete}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: t.textMuted }}>
            {meta.from ?? 0}–{meta.to ?? 0} <span style={{ color: t.textFaint }}>{tr.of}</span> <strong style={{ color: t.text }}>{meta.total}</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={() => load(page - 1)} disabled={page <= 1}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: t.surface, border: '1px solid ' + t.border, color: page <= 1 ? t.textFaint : t.text, fontSize: '12px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} /> {tr.previous}
            </button>
            <span style={{ fontSize: '13px', color: t.textMuted, padding: '0 8px' }}>{tr.page} {page} / {meta.last_page}</span>
            <button onClick={() => load(page + 1)} disabled={page >= meta.last_page}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: t.surface, border: '1px solid ' + t.border, color: page >= meta.last_page ? t.textFaint : t.text, fontSize: '12px', cursor: page >= meta.last_page ? 'not-allowed' : 'pointer', opacity: page >= meta.last_page ? 0.4 : 1 }}>
              {tr.next} <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

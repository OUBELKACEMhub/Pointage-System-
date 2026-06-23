import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, Upload, Trash2, Eye, ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/client'

const STATUS_COLOR = {
  pending:  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#f59e0b' },
  approved: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#10b981' },
  rejected: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  text: '#ef4444' },
}

function StatusBadge({ status, tr }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.pending
  const label = { pending: tr.justifPending, approved: tr.justifApproved, rejected: tr.justifRejected }[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {status === 'pending' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text, display: 'inline-block' }} />}
      {status === 'approved' && <Check size={10} />}
      {status === 'rejected' && <X size={10} />}
      {label}
    </span>
  )
}


export default function Justifications() {
  const { tr, lang } = useLang()
  const { dark } = useTheme()

  const [employees, setEmployees] = useState([])
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7))
  const [empSearch, setEmpSearch] = useState('')
  const [page, setPage] = useState(1)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [formEmp, setFormEmp] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formFile, setFormFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const [formStatus, setFormStatus] = useState('approved')
  const [unjustified, setUnjustified] = useState([])   // absences/retards non justifiés de l'employé
  const [loadingUnj, setLoadingUnj] = useState(false)

  useEffect(() => {
    api.get('/employees?per_page=200').then(r => setEmployees(r.data.data || r.data))
  }, [])

  // Quand l'employé change → charger ses absences/retards non justifiés du mois précédent
  useEffect(() => {
    if (!formEmp) { setUnjustified([]); return }
    setLoadingUnj(true)
    const now   = new Date()
    const from  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const to    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    api.get('/attendance', { params: { emp_id: formEmp, from, to, status: 'absent,late', per_page: 50 } })
      .then(r => {
        const rows = r.data.data ?? []
        // garder seulement ceux sans justification approuvée
        setUnjustified(rows.filter(row => !row.justification))
      })
      .catch(() => setUnjustified([]))
      .finally(() => setLoadingUnj(false))
  }, [formEmp])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (statusFilter) params.status = statusFilter
      if (monthFilter)  params.month  = monthFilter
      if (empSearch)    params.employee = empSearch
      const r = await api.get('/justifications', { params })
      setItems(r.data.data)
      setMeta({ current_page: r.data.current_page, last_page: r.data.last_page, total: r.data.total })
    } catch {}
    setLoading(false)
  }, [statusFilter, monthFilter, empSearch])

  useEffect(() => { setPage(1); load(1) }, [load])
  useEffect(() => { load(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async e => {
    e.preventDefault()
    if (!formEmp || !formDate || !formReason.trim()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('employee_id', formEmp)
      fd.append('work_date', formDate)
      fd.append('reason', formReason)
      fd.append('status', formStatus)
      if (formFile) fd.append('file', formFile)
      await api.post('/justifications', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowForm(false)
      setFormEmp(''); setFormDate(''); setFormReason(''); setFormFile(null); setFormStatus('approved'); setUnjustified([])
      load(1); setPage(1)
    } catch {}
    setSubmitting(false)
  }

  const destroy = async id => {
    if (!window.confirm(tr.justifConfirm)) return
    await api.delete(`/justifications/${id}`)
    load(page)
  }

  // Styles
  const c = {
    page:    { padding: '28px', maxWidth: '1200px', margin: '0 auto' },
    card:    { background: dark ? '#1f2937' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' },
    h1:      { margin: 0, fontSize: '22px', fontWeight: 700, color: dark ? '#f9fafb' : '#111827' },
    sub:     { margin: '4px 0 0', fontSize: '13px', color: dark ? '#9ca3af' : '#6b7280' },
    btn:     { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
    label:   { display: 'block', fontSize: '12px', fontWeight: 600, color: dark ? '#9ca3af' : '#6b7280', marginBottom: '5px' },
    inp:     { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, background: dark ? '#111827' : '#f9fafb', color: dark ? '#f9fafb' : '#111827', fontSize: '13px', boxSizing: 'border-box' },
    sel:     { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, background: dark ? '#111827' : '#f9fafb', color: dark ? '#f9fafb' : '#111827', fontSize: '13px', boxSizing: 'border-box', cursor: 'pointer' },
    th:      { padding: '11px 14px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: dark ? '#6b7280' : '#9ca3af', textAlign: 'start', whiteSpace: 'nowrap' },
    td:      { padding: '13px 14px', fontSize: '13px', color: dark ? '#d1d5db' : '#374151', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, verticalAlign: 'middle' },
    iconBtn: (col) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${col}22`, background: `${col}15`, color: col, cursor: 'pointer', flexShrink: 0 }),
  }

  return (
    <div style={c.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={c.h1}>{tr.justifTitle}</h1>
          <p style={c.sub}>{tr.justifSub}</p>
        </div>
        <button style={c.btn} onClick={() => setShowForm(v => !v)}>
          <Upload size={14} />
          {tr.newJustif}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={c.card}>
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={c.label}>{tr.leaveEmployee}</label>
                <select style={c.sel} value={formEmp} onChange={e => setFormEmp(e.target.value)} required>
                  <option value="">{tr.selectEmployee}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              {/* Panel absences/retards non justifiés */}
              {formEmp && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={c.label}>
                    {loadingUnj ? tr.loading : unjustified.length === 0
                      ? (tr.noJustifs)
                      : `${unjustified.length} absence(s)/retard(s) non justifié(s) — cliquez pour sélectionner`}
                  </label>
                  {!loadingUnj && unjustified.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                      {unjustified.map(row => {
                        const date = String(row.work_date).slice(0, 10)
                        const isLate   = row.status === 'late'
                        const isAbsent = row.status === 'absent'
                        const selected = formDate === date
                        const color = isLate ? '#f59e0b' : '#ef4444'
                        return (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setFormDate(date)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '7px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                              border: `1px solid ${selected ? '#6366f1' : color + '55'}`,
                              background: selected ? 'rgba(99,102,241,0.15)' : `${color}10`,
                              color: selected ? '#818cf8' : color,
                              transition: 'all 0.15s',
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected ? '#6366f1' : color, flexShrink: 0 }} />
                            <span>{date}</span>
                            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
                              {isLate ? (tr.statusLate ?? 'Retard') : (tr.statusAbsent ?? 'Absent')}
                              {isLate && row.check_in ? ` · ${String(row.check_in).slice(0,5)}` : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={c.label}>{tr.justifDate}</label>
                <input type="date" style={c.inp} value={formDate} onChange={e => setFormDate(e.target.value)} required />
              </div>
              <div>
                <label style={c.label}>{tr.justifStatus}</label>
                <select style={c.sel} value={formStatus} onChange={e => setFormStatus(e.target.value)}>
                  <option value="approved">{tr.justifApproved}</option>
                  <option value="pending">{tr.justifPending}</option>
                  <option value="rejected">{tr.justifRejected}</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={c.label}>{tr.justifReason}</label>
                <textarea
                  style={{ ...c.inp, resize: 'vertical', minHeight: '72px' }}
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  required
                  placeholder={tr.justifReason + '...'}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={c.label}>{tr.justifFile}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.3)'}`,
                    borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: dark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <FileText size={22} color="#818cf8" style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', color: dark ? '#d1d5db' : '#374151', fontWeight: 500 }}>
                    {formFile ? formFile.name : tr.justifFileHint}
                  </div>
                  {formFile && (
                    <button type="button" onClick={e => { e.stopPropagation(); setFormFile(null) }}
                      style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {tr.delete}
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => setFormFile(e.target.files[0] || null)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, background: 'transparent', color: dark ? '#9ca3af' : '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
                {tr.cancel}
              </button>
              <button type="submit" disabled={submitting} style={{ ...c.btn, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? tr.saving : tr.submit}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...c.card, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: dark ? '#6b7280' : '#9ca3af' }} />
            <input
              placeholder={tr.filterEmployee}
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              style={{ ...c.inp, paddingLeft: '30px' }}
            />
          </div>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={{ ...c.inp, flex: '0 0 150px', width: '150px' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...c.sel, flex: '0 0 140px', width: '140px' }}>
            <option value="">{tr.justifAll}</option>
            <option value="pending">{tr.justifPending}</option>
            <option value="approved">{tr.justifApproved}</option>
            <option value="rejected">{tr.justifRejected}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={c.card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: dark ? '#6b7280' : '#9ca3af' }}>{tr.loading}</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={36} color={dark ? '#374151' : '#d1d5db'} style={{ marginBottom: '10px' }} />
            <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: '14px' }}>{tr.noJustifs}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[tr.leaveEmployee, tr.justifDate, tr.justifReason, tr.justifFile, tr.justifStatus, tr.actions].map(h => (
                    <th key={h} style={c.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={c.td}>
                      <div style={{ fontWeight: 600, color: dark ? '#f9fafb' : '#111827' }}>
                        {item.employee?.first_name} {item.employee?.last_name}
                      </div>
                      <div style={{ fontSize: '11px', color: dark ? '#6b7280' : '#9ca3af' }}>
                        {item.employee?.department}
                      </div>
                    </td>
                    <td style={c.td}>{item.work_date}</td>
                    <td style={{ ...c.td, maxWidth: '220px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                        {item.reason}
                      </div>
                    </td>
                    <td style={c.td}>
                      {item.file_url ? (
                        <a href={item.file_url} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
                          <Eye size={12} />
                          {tr.justifViewFile}
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', color: dark ? '#6b7280' : '#9ca3af' }}>{tr.justifNoFile}</span>
                      )}
                    </td>
                    <td style={c.td}>
                      <StatusBadge status={item.status} tr={tr} />
                    </td>
                    <td style={c.td}>
                      <button title={tr.delete} onClick={() => destroy(item.id)} style={c.iconBtn('#ef4444')}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <span style={{ fontSize: '12px', color: dark ? '#6b7280' : '#9ca3af' }}>
              {tr.page} {meta.current_page} {tr.of} {meta.last_page} — {meta.total} {tr.records}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, background: 'transparent', color: dark ? '#9ca3af' : '#6b7280', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ChevronLeft size={13} /> {tr.previous}
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
                style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`, background: 'transparent', color: dark ? '#9ca3af' : '#6b7280', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {tr.next} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

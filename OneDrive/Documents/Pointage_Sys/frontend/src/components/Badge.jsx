const styles = {
  present: { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', dot: '#10b981' },
  late:    { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', dot: '#f59e0b' },
  absent:  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', dot: '#ef4444' },
}
const labels = { present: 'Présent', late: 'En retard', absent: 'Absent' }

export default function Badge({ status }) {
  const s = styles[status] ?? { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', dot: '#64748b' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {labels[status] ?? status}
    </span>
  )
}

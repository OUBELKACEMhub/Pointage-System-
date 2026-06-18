import { useTheme } from '../context/ThemeContext'

const labels = { present: 'Présent', late: 'En retard', absent: 'Absent' }

export default function Badge({ status }) {
  const { t } = useTheme()
  const s = t.badge[status] ?? { bg: t.primaryBg, color: t.textMuted, dot: t.textMuted }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {labels[status] ?? status}
    </span>
  )
}

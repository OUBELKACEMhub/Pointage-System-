import { useTheme } from '../context/ThemeContext'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const fmtDay = dateStr => {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

export default function WeekChart({ days }) {
  const { t } = useTheme()
  if (!days || days.length === 0) return null

  const W = 560
  const H = 140
  const PADDING = { top: 16, bottom: 28, left: 0, right: 0 }
  const chartH = H - PADDING.top - PADDING.bottom
  const colW = W / days.length

  const maxVal = Math.max(...days.map(d => d.present + d.late + d.absent), 1)

  const barH = (n) => (n / maxVal) * chartH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f}
          x1={0} x2={W}
          y1={PADDING.top + chartH * (1 - f)}
          y2={PADDING.top + chartH * (1 - f)}
          stroke={t.border} strokeWidth={0.5} strokeDasharray="4,4"
        />
      ))}

      {days.map((day, i) => {
        const x = i * colW + colW * 0.15
        const bW = colW * 0.7
        const base = PADDING.top + chartH

        const hP = barH(day.present)
        const hL = barH(day.late)
        const hA = barH(day.absent)

        const isToday = day.date === new Date().toISOString().slice(0, 10)

        return (
          <g key={day.date}>
            {/* absent (bottom) */}
            {hA > 0 && <rect x={x} y={base - hA} width={bW} height={hA} fill="#ef444430" rx={2} />}
            {/* late (middle) */}
            {hL > 0 && <rect x={x} y={base - hA - hL} width={bW} height={hL} fill="#f59e0b80" rx={2} />}
            {/* present (top) */}
            {hP > 0 && <rect x={x} y={base - hA - hL - hP} width={bW} height={hP} fill={isToday ? '#6366f1' : '#6366f180'} rx={2} />}

            {/* Day label */}
            <text
              x={x + bW / 2} y={H - 4}
              textAnchor="middle" fontSize={9}
              fill={isToday ? '#6366f1' : t.textFaint}
              fontWeight={isToday ? '700' : '400'}
            >
              {fmtDay(day.date)}
            </text>

            {/* Value on top */}
            {(day.present + day.late) > 0 && (
              <text
                x={x + bW / 2}
                y={base - hA - hL - hP - 3}
                textAnchor="middle" fontSize={8}
                fill={t.textFaint}
              >
                {day.present + day.late}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

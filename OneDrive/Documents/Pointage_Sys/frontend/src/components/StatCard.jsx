import { useTheme } from '../context/ThemeContext'

const ACCENT = {
  blue:   { light: '#6366f1', bgL: 'rgba(99,102,241,0.08)',  bgD: 'rgba(99,102,241,0.15)'  },
  green:  { light: '#16a34a', bgL: 'rgba(22,163,74,0.08)',   bgD: 'rgba(22,163,74,0.15)'   },
  amber:  { light: '#d97706', bgL: 'rgba(217,119,6,0.08)',   bgD: 'rgba(217,119,6,0.15)'   },
  red:    { light: '#dc2626', bgL: 'rgba(220,38,38,0.08)',   bgD: 'rgba(220,38,38,0.15)'   },
}

export default function StatCard({ label, value, color = 'blue', icon: Icon, sub }) {
  const { dark, t } = useTheme()
  const a = ACCENT[color] ?? ACCENT.blue
  const accent = dark ? a.light.replace('6','8') : a.light
  const iconBg  = dark ? a.bgD : a.bgL

  return (
    <div style={{
      background: t.surface,
      border: '1px solid ' + t.border,
      borderRadius: '14px',
      padding: '20px',
      transition: 'box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon && <Icon size={20} color={a.light} />}
        </div>
      </div>
      <div style={{ color: t.text, fontSize: '28px', fontWeight: 700, lineHeight: 1, marginBottom: '6px' }}>
        {value ?? <span style={{ color: t.textFaint }}>—</span>}
      </div>
      <div style={{ color: t.textMuted, fontSize: '13px', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: t.textFaint, fontSize: '11px', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

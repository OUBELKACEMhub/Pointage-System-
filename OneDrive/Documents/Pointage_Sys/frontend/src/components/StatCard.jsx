const themes = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  icon: 'rgba(59,130,246,0.2)',  iconColor: '#60a5fa', text: '#93c5fd', value: '#fff' },
  green:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  icon: 'rgba(16,185,129,0.2)',  iconColor: '#34d399', text: '#6ee7b7', value: '#fff' },
  yellow: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  icon: 'rgba(245,158,11,0.2)',  iconColor: '#fbbf24', text: '#fcd34d', value: '#fff' },
  red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   icon: 'rgba(239,68,68,0.2)',   iconColor: '#f87171', text: '#fca5a5', value: '#fff' },
}

export default function StatCard({ label, value, color, icon: Icon, trend }) {
  const t = themes[color] ?? themes.blue
  return (
    <div className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-default"
      style={{ background: t.bg, border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: t.icon }}>
          {Icon && <Icon size={22} style={{ color: t.iconColor }} />}
        </div>
        {trend !== undefined && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: trend >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: trend >= 0 ? '#34d399' : '#f87171' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold mb-1" style={{ color: t.value }}>
          {value ?? <span className="text-slate-500">—</span>}
        </p>
        <p className="text-sm font-medium" style={{ color: t.text }}>{label}</p>
      </div>
    </div>
  )
}

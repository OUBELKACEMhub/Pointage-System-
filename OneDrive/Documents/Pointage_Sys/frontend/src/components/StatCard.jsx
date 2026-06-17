export default function StatCard({ label, value, color, icon: Icon }) {
  const colors = {
    green:  'bg-green-50  border-green-200  text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50    border-red-200    text-red-700',
    blue:   'bg-blue-50   border-blue-200   text-blue-700',
  }

  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      {Icon && <Icon size={32} strokeWidth={1.5} />}
      <div>
        <p className="text-sm font-medium opacity-75">{label}</p>
        <p className="text-3xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  )
}

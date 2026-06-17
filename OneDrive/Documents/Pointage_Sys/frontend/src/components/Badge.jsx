const styles = {
  present: 'bg-green-100 text-green-800',
  late:    'bg-yellow-100 text-yellow-800',
  absent:  'bg-red-100 text-red-800',
}

const labels = {
  present: 'Présent',
  late:    'En retard',
  absent:  'Absent',
}

export default function Badge({ status }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

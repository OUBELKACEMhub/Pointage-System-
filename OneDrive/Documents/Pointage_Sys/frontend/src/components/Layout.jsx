import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useTheme } from '../context/ThemeContext'

export default function Layout() {
  const { t } = useTheme()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
